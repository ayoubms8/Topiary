import React from 'react';
import { Zap, Settings, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

export default function Sidebar({ inputs, setInputs, handleOptimize, optimizing, alerts }) {
    const handleChange = (key, value) => {
        setInputs(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    return (
        <aside className="w-96 flex flex-col border-l border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] shadow-2xl z-20">
            <div className="h-24 px-6 border-b border-dark-border flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                    <Zap className="text-primary" />
                    <h1 className="text-xl font-bold tracking-wider text-white">TOPIARY<span className="text-primary">TWIN</span></h1>
                </div>
                <p className="text-xs text-text-muted font-mono">DIGITAL PLANT MANAGER</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            Sulfur Flow (T/h)
                        </label>
                        <span className="font-mono text-xl font-bold text-primary">{inputs.sulfur_in} <span className="text-sm text-text-muted">T/h</span></span>
                    </div>
                    <input
                        type="range" min="0" max="220" step="1"
                        value={inputs.sulfur_in}
                        onChange={(e) => handleChange('sulfur_in', e.target.value)}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-text-muted font-mono">
                        <span>0 T/h</span>
                        <span>220 T/h</span>
                    </div>
                </div>

                <div className="h-px bg-dark-border" />


                <div className="space-y-6">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <Settings size={14} /> Turbine Admission
                    </h3>
                    {[1, 2, 3].map(id => (
                        <div key={id} className="bg-dark-card p-3 rounded border border-dark-border">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-gray-300">GTA {id}</span>
                                <span className="font-mono text-secondary">{inputs[`adm${id}`]} T/h</span>
                            </div>
                            <input
                                type="range" min="0" max="220"
                                value={inputs[`adm${id}`]}
                                onChange={(e) => handleChange(`adm${id}`, e.target.value)}
                                className="w-full h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-secondary"
                            />
                        </div>
                    ))}
                </div>




                {alerts && alerts.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-xl p-3 flex items-start gap-3">
                        <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={16} />
                        <div>
                            <h4 className="text-xs font-bold text-orange-400 uppercase mb-1">Active Alerts ({alerts.length})</h4>
                            <ul className="space-y-1">
                                {alerts.map((alert, idx) => (
                                    <li key={idx} className="text-xs text-gray-300 leading-relaxed">• {alert.msg}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>


        </aside>
    );
}
