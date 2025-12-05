from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from openai import OpenAI
import uvicorn
import os
import time

app = FastAPI(title="EnerOptim API", description="Industrial Digital Twin Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")

# 1. DIGITAL TWIN LOGIC
class GlobalPlantSimulator:
    def __init__(self):
        self.model = None
        self.training_error = None
        self.baseline_consumption = {}
        self.steam_ratio = 2.2 # Default fallback
        self.load_and_train()

    def load_and_train(self):
        print("Loading and Training Model...")
        try:
            file_path = "Data_Final.csv"
            try:
                df = pd.read_csv(file_path, encoding='utf-8', engine='python', on_bad_lines='skip')
                if len(df.columns) < 2 or any('\x00' in str(c) for c in df.columns): raise ValueError()
            except:
                try:
                    with open(file_path, "rb") as f: df = pd.read_excel(f, engine='openpyxl')
                except:
                    df = pd.read_csv(file_path, encoding='latin-1', sep=';', engine='python', on_bad_lines='skip')

            df.columns = df.columns.str.strip()
            df = df.apply(pd.to_numeric, errors='coerce')
            
            sulfur_cols = [c for c in df.columns if 'soufre' in c.lower() or ('01' in c and ('A' in c or 'B' in c))]
            if not sulfur_cols: raise ValueError("No sulfur columns")
            df['Total_Sulfur'] = df[sulfur_cols].sum(axis=1)
            
            total_adm = df['Adm GTA1'] + df['Adm GTA2'] + df['Adm GTA3']
            self.steam_ratio = (total_adm / df['Total_Sulfur']).median()
            print(f"Learned Steam Ratio: {self.steam_ratio:.2f}")

            required_inputs = ['Total_Sulfur', 'Adm GTA1', 'Adm GTA2', 'Adm GTA3']
            required_outputs = ['P GTA1', 'P GTA2', 'P GTA3', 'P GTAA', 'P GTAB', 
                                'Pession vap MP1', 'S TR1', 'S TR2', 'S TR3',
                                'Sout 1', 'Sout 2', 'Sout 3']
            
            final_inputs = [c for c in required_inputs if c in df.columns]
            final_outputs = [c for c in required_outputs if c in df.columns]
            
            df = df[final_inputs + final_outputs].dropna()
            
            for gta in ['GTA1', 'GTA2', 'GTA3']:
                p_col, adm_col = f'P {gta}', f'Adm {gta}'
                if p_col in df.columns:
                    valid = df[df[p_col] > 1]
                    self.baseline_consumption[gta] = (valid[adm_col] / valid[p_col]).median()
                else: self.baseline_consumption[gta] = 6.0

            self.model = MultiOutputRegressor(RandomForestRegressor(n_estimators=50, random_state=42))
            self.model.fit(df[final_inputs], df[final_outputs])
            print("Model Trained Successfully")
            
        except Exception as e:
            self.training_error = str(e)
            print(f"Training Failed: {e}")

    def predict(self, sulfur, adm1, adm2, adm3):
        if self.model is None: return None 
        try:
            preds = self.model.predict([[sulfur, adm1, adm2, adm3]])[0]
            prod_sulfurique = sulfur
            
            return {
                "P_GTA1": preds[0], "P_GTA2": preds[1], "P_GTA3": preds[2],
                "P_GTAA": preds[3], "P_GTAB": preds[4],
                "MP_Pressure": preds[5],
                "TR1": preds[6], "TR2": preds[7], "TR3": preds[8],
                "Sout1": preds[9], "Sout2": preds[10], "Sout3": preds[11],
                "HP_TR": 1.24 * prod_sulfurique,
                "MP_TR": 0.44 * prod_sulfurique
            }
        except: return None

    def predict_total_power(self, sulfur, adm1, adm2, adm3):
        """Fast helper for the solver that just returns total MW"""
        res = self.predict(sulfur, adm1, adm2, adm3)
        if res:
            return res['P_GTA1'] + res['P_GTA2'] + res['P_GTA3'] + res['P_GTAA'] + res['P_GTAB']
        return 0

sim = GlobalPlantSimulator()

# 2. SOLVER ENGINE (RANDOM SEARCH)

def solve_random_search(sulfur_in, n_iter=1000):
    """
    Random Search Optimization.
    Fast, robust for step-functions (Random Forest), and avoids local minima.
    """
    max_steam = sulfur_in * sim.steam_ratio
    
    best_power = -1.0
    best_adm = [0, 0, 0]
    
    for _ in range(n_iter):
        r = np.random.rand(3)
        proposal = (r / r.sum()) * max_steam
        proposal = np.clip(proposal, 0, 220)
        
        # Re-check sum constraint after clipping
        if proposal.sum() > max_steam:
            scale = max_steam / proposal.sum()
            proposal = proposal * scale
            
        pwr = sim.predict_total_power(sulfur_in, proposal[0], proposal[1], proposal[2])
        
        if pwr > best_power:
            best_power = pwr
            best_adm = proposal
            
    return list(best_adm), best_power

# 3. API ENDPOINTS

class SimulationRequest(BaseModel):
    sulfur_in: float
    adm1: float
    adm2: float
    adm3: float

class ChatRequest(BaseModel):
    prompt: str
    context_data: dict

class OptimizationRequest(BaseModel):
    sulfur_in: float
    current_adm: list

@app.get("/")
def read_root():
    return {"status": "online", "model_loaded": sim.model is not None}

@app.post("/simulate")
def run_simulation(req: SimulationRequest):
    if sim.model is None:
        raise HTTPException(status_code=500, detail=f"Model not trained: {sim.training_error}")
    
    result = sim.predict(req.sulfur_in, req.adm1, req.adm2, req.adm3)
    if result is None:
        raise HTTPException(status_code=500, detail="Prediction failed")
    
    est_steam = req.sulfur_in * sim.steam_ratio
    total_adm = req.adm1 + req.adm2 + req.adm3
    vap_dispo = est_steam - total_adm - result['HP_TR']
    
    total_power = result['P_GTA1'] + result['P_GTA2'] + result['P_GTA3'] + result['P_GTAA'] + result['P_GTAB']
    efficiency = (total_power / (est_steam * 0.22)) * 100 if est_steam > 0 else 0
    efficiency = min(efficiency, 100.0)
    result['meta'] = {
        'est_steam_gen': est_steam,
        'vap_dispo': vap_dispo,
        'total_power': total_power,
        'global_efficiency': efficiency
    }
    
    return result

@app.post("/get_optimization_suggestion")
def get_suggestion(req: OptimizationRequest):
    """
    Runs Random Search Solver -> Sends optimal data to LLM -> Returns text suggestion
    """
    if sim.model is None:
        raise HTTPException(status_code=500, detail="Model not initialized")

    optimal_adm, max_power = solve_random_search(req.sulfur_in)
    
    current_power = sim.predict_total_power(req.sulfur_in, req.current_adm[0], req.current_adm[1], req.current_adm[2])
    gain = max_power - current_power
    
    context = f"""
    CONTEXT: Industrial Energy Optimization (Sulfuric Acid Plant).
    
    CURRENT STATE:
    - Input Sulfur: {req.sulfur_in} T/h
    - Current GTA Split: {req.current_adm}
    - Current Power: {current_power:.2f} MW
    
    OPTIMAL STATE (Calculated by Solver):
    - Recommended GTA Split: {[round(x, 1) for x in optimal_adm]}
    - Max Power: {max_power:.2f} MW
    - Potential Gain: +{gain:.2f} MW
    
    TASK: Write a short suggestion to the operator. Tell them exactly how to adjust the valves (GTA 1, 2, 3) to achieve the gain.
    """
    
    try:
        res = client.chat.completions.create(
            model="qwen2.5-14b",
            messages=[
                {"role": "system", "content": "You are a concise industrial expert. Do not explain the math. Just give the setpoints."},
                {"role": "user", "content": context}
            ]
        )
        return {
            "suggestion": res.choices[0].message.content,
            "optimal_values": optimal_adm,
            "potential_gain": gain
        }
    except Exception as e:
        # Fallback if LLM is down, still return optimal_adm
        return {
            "suggestion": f"Adjust GTAs to {optimal_adm} to gain {gain:.2f} MW.",
            "optimal_values": optimal_adm,
            "potential_gain": gain
        }

@app.post("/ai/chat")
def chat_with_qwen(req: ChatRequest):
    context = f"""
    CONTEXT:
    You are an expert industrial operator assistant for a Sulfuric Acid plant. 
    The plant generates high-pressure steam (exothermic process) which feeds 3 Turbo-Alternator Groups (GTAs) and a Steam Collector.
    
    LIVE PLANT DATA:
    - GTA 1 Power: {req.context_data.get('P_GTA1', 0):.1f} MW
    - MP Pressure: {req.context_data.get('MP_Pressure', 0):.2f} bar
    
    INSTRUCTIONS:
    - Be precise and concise. 
    - Assume the user is an expert. 
    - Do not explain basic concepts.
    - Focus on operational insights.
    
    USER QUESTION: {req.prompt}
    """
    try:
        res = client.chat.completions.create(
            model="qwen2.5-14b",
            messages=[
                {"role": "system", "content": "You are an expert industrial operator. Be concise and precise."},
                {"role": "user", "content": context}
            ]
        )
        return {"response": res.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI Service Error: {str(e)}")

@app.get("/config")
def get_config():
    return {
        "steam_ratio": sim.steam_ratio,
        "baselines": sim.baseline_consumption
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
