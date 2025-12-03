import os
import json
import time
import threading
import random
import pandas as pd
from openai import OpenAI
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from colorama import Fore, Style, init

# Initialize colors
init(autoreset=True)

# ==========================================
# PART 1: THE DIGITAL TWIN (Physics Engine)
# ==========================================
# (Same logic as before, just compacted)

class RealPlantSimulator:
    def __init__(self, csv_path):
        self.model = None
        print(f"📂 Loading data from {csv_path}...")
        self.df = pd.read_csv(csv_path)
        self.df.columns = self.df.columns.str.strip()
        
        required_cols = [
            'Admission_HP_GTA_1', 'Admission_HP_GTA_2', 'Admission_HP_GTA_3',
            'Soutirage_MP_GTA_1', 'Prod_EE_GTA_1',
            'Soutirage_MP_GTA_2', 'Prod_EE_GTA2_2',
            'Soutirage_MP_GTA_3', 'Prod_EE_GTA_3'
        ]
        self.df = self.df[required_cols].dropna()
        self.train_model()

    def train_model(self):
        print("⚙️ Training Digital Twin...")
        X = self.df[['Admission_HP_GTA_1', 'Admission_HP_GTA_2', 'Admission_HP_GTA_3']]
        y = self.df[[
            'Soutirage_MP_GTA_1', 'Prod_EE_GTA_1',
            'Soutirage_MP_GTA_2', 'Prod_EE_GTA2_2', 
            'Soutirage_MP_GTA_3', 'Prod_EE_GTA_3'
        ]]
        self.model = MultiOutputRegressor(RandomForestRegressor(n_estimators=50, random_state=42))
        self.model.fit(X, y)
        print("✅ Model Trained.")

    def predict(self, hp1, hp2, hp3):
        if not self.model: return None
        input_data = pd.DataFrame([[hp1, hp2, hp3]], columns=['Admission_HP_GTA_1', 'Admission_HP_GTA_2', 'Admission_HP_GTA_3'])
        preds = self.model.predict(input_data)[0]
        
        # Calculate Total Efficiency (MW per ton of steam)
        total_ep = preds[1] + preds[3] + preds[5]
        total_input = hp1 + hp2 + hp3
        efficiency = total_ep / total_input if total_input > 0 else 0
        
        return {
            "total_ep": total_ep,
            "efficiency": efficiency,
            "inputs": [hp1, hp2, hp3]
        }

    def optimize(self, total_hp):
        # Quick brute force optimization
        best_ep = -1
        best_split = []
        step = 20
        for h1 in range(0, int(total_hp), step):
            for h2 in range(0, int(total_hp) - h1, step):
                h3 = total_hp - h1 - h2
                if h1>220 or h2>220 or h3>220: continue
                res = self.predict(h1, h2, h3)
                if res['total_ep'] > best_ep:
                    best_ep = res['total_ep']
                    best_split = [h1, h2, h3]
        return best_split, best_ep

# ==========================================
# PART 2: LIVE PLANT STATE MANAGER
# ==========================================

class PlantStateManager:
    def __init__(self, simulator):
        self.sim = simulator
        self.current_sulfate = 50.0 # Starting value
        self.sulfate_to_steam = 2.0
        self.running = True
        self.latest_readings = {}
        self.alert_queue = []

    def start_simulation_loop(self):
        """Runs in background: Simulates the plant changing every 3 seconds"""
        while self.running:
            # 1. Fluctuate Sulfate Input (Random walk)
            change = random.uniform(-5, 5)
            self.current_sulfate = max(10, min(120, self.current_sulfate + change))
            
            # 2. Simulate current operation (assume unoptimized even split for now)
            total_steam = self.current_sulfate * self.sulfate_to_steam
            split = total_steam / 3
            results = self.sim.predict(split, split, split)
            
            self.latest_readings = {
                "sulfate": self.current_sulfate,
                "steam": total_steam,
                "ep_output": results['total_ep'],
                "efficiency": results['efficiency']
            }
            
            # 3. MONITOR: Check for optimization opportunities
            # Ask the simulator: "What is the theoretical max?"
            opt_split, max_ep = self.sim.optimize(total_steam)
            
            # If current output is > 5% worse than theoretical max, trigger alert
            loss = max_ep - results['total_ep']
            if loss > 2.0: # If we are losing more than 2 MW
                alert_msg = (f"⚠️ INEFFICIENCY DETECTED! Sulfate: {int(self.current_sulfate)}T. "
                             f"Current EP: {int(results['total_ep'])}MW. "
                             f"Potential: {int(max_ep)}MW. "
                             f"Recommendation: Adjust GTAs to {opt_split}.")
                # Only add if queue is empty to avoid spam
                if not self.alert_queue:
                    self.alert_queue.append(alert_msg)
            
            time.sleep(4) # Updates every 4 seconds

# ==========================================
# PART 3: THE CHATBOT LOOP
# ==========================================

def chat_loop(state_manager):
    client = OpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")
    print(Fore.GREEN + "\n🔋 LIVE ENERGY MONITOR ACTIVE.")
    print(Fore.CYAN + " The system is running in the background. Press Enter to chat, or wait for alerts.\n")

    history = [
        {"role": "system", "content": "You are an AI overseeing a live energy plant. You receive alerts from the monitoring system and explain them to the operator."}
    ]

    while True:
        # Check for alerts from the simulation loop
        if state_manager.alert_queue:
            alert = state_manager.alert_queue.pop(0)
            print(Fore.RED + f"\n[SYSTEM ALERT]: {alert}")
            
            # Let the LLM explain the alert
            history.append({"role": "system", "content": f"System Alert Triggered: {alert}. Explain briefly to the operator why this change is needed."})
            res = client.chat.completions.create(model="qwen2.5-14b", messages=history)
            print(Fore.YELLOW + f"Bot: {res.choices[0].message.content}\n")
            history.append(res.choices[0].message)

        # Non-blocking input is hard in Python terminal, 
        # so we rely on the user seeing the live data and typing when they want.
        # Ideally, this would be a Web UI (Streamlit) where the loop updates the screen automatically.
        
        # For terminal demo: We just print status every loop unless user types
        # This part effectively pauses the loop while waiting for input, which is a limitation of terminal.
        # To see "Streaming" logs, we'd need a UI framework.
        
        # Mocking the "Live Dashboard" in terminal:
        data = state_manager.latest_readings
        if data:
            print(f"\r[LIVE] Sulfate: {data['sulfate']:.1f}T | EP: {data['ep_output']:.1f}MW | Eff: {data['efficiency']:.3f}", end="")
        
        # We use a short timeout input trick or just let the user interrupt
        # For simplicity in this script: The simulation runs in background thread.
        # You press ENTER to chat.
        
        # (See explanation below on why terminal chat + background loop is tricky)

if __name__ == "__main__":
    # Load Real Data
    sim = RealPlantSimulator("Data_Energie.csv")
    
    # Start the "World"
    manager = PlantStateManager(sim)
    
    # Threading allows the "Plant" to run while we chat
    sim_thread = threading.Thread(target=manager.start_simulation_loop, daemon=True)
    sim_thread.start()
    
    # Start Chat
    try:
        chat_loop(manager)
    except KeyboardInterrupt:
        print("\nStopping plant...")
        manager.running = False
