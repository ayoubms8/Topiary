import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import KPIHeader from './components/KPIHeader';
import DigitalTwin from './components/DigitalTwin';
import AIAssistant from './components/AIAssistant';

const API_URL = "http://localhost:8000";

export default function App() {

  const [inputs, setInputs] = useState({
    sulfur_in: 100,
    adm1: 150,
    adm2: 150,
    adm3: 150
  });

  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', content: 'System Online. Digital Twin connected.' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);


  const fetchSimulation = async () => {
    try {
      const res = await axios.post(`${API_URL}/simulate`, inputs);
      setData(res.data);
      checkAlerts(res.data, inputs);
    } catch (err) {
      console.error("Backend Error:", err);
    }
  };

  const checkAlerts = (state, currentInputs) => {
    const newAlerts = [];


    const totalExtraction = currentInputs.adm1 + currentInputs.adm2 + currentInputs.adm3;
    if (state.meta && state.meta.est_steam_gen < totalExtraction) {
      newAlerts.push({ type: 'critical', msg: `IMPOSSIBLE SCENARIO: Total Extraction (${totalExtraction} T/h) > Generated Steam (${state.meta.est_steam_gen.toFixed(0)} T/h)` });
    }


    if (state.MP_Pressure < 7.5) {
      const rec = state.TR1 > 40 ? "Lower GTA A Load" : "Check CAP Consumption";
      newAlerts.push({ type: 'critical', msg: `Low MP Pressure (${state.MP_Pressure.toFixed(2)} bar). Recommendation: ${rec}` });
    }


    [1, 2, 3].forEach(i => {
      const adm = currentInputs[`adm${i}`];
      const pwr = state[`P_GTA${i}`];
      if (pwr > 1) {
        const cs = adm / pwr;
        if (cs > 7.0) newAlerts.push({ type: 'warning', msg: `GTA ${i} High Consumption: ${cs.toFixed(1)} T/MW` });
      }
    });

    setAlerts(newAlerts);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/ai/chat`, {
        prompt: userMsg,
        context_data: data || {}
      });
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'system', content: "Error contacting AI." }]);
    }
    setLoading(false);
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await axios.post(`${API_URL}/get_optimization_suggestion`, {
        sulfur_in: inputs.sulfur_in,
        current_adm: [inputs.adm1, inputs.adm2, inputs.adm3]
      });

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `💡 OPTIMIZATION SUGGESTION:\n${res.data.suggestion}\n(Potential Gain: +${res.data.potential_gain.toFixed(2)} MW)`
      }]);
    } catch (err) {
      console.error(err);
    }
    setOptimizing(false);
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSimulation();
    }, 300); // 300ms delay after slider stops
    return () => clearTimeout(timer);
  }, [inputs]);

  return (
    <Layout>
      <Sidebar inputs={inputs} setInputs={setInputs} />

      <div className="flex-1 flex flex-col relative">
        <KPIHeader data={data} />
        <DigitalTwin data={data} inputs={inputs} />
      </div>

      <AIAssistant
        chatHistory={chatHistory}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleChat={handleChat}
        loading={loading}
        alerts={alerts}
        handleOptimize={handleOptimize}
        optimizing={optimizing}
      />
    </Layout>
  );
}
