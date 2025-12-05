import React, { useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, ArrowDown, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

export default function AIAssistant({
    chatHistory,
    chatInput,
    setChatInput,
    handleChat,
    loading,
    alerts,
    handleOptimize,
    optimizing
}) {
    return (
        <aside className="w-96 flex flex-col border-l border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] shadow-2xl z-20">
            <div className="p-4 border-b border-dark-border bg-dark-card">
                <h2 className="font-bold flex items-center gap-2 text-white">
                    <MessageSquare size={18} className="text-blue-500" /> AI Assistant (Qwen-14B)
                </h2>
            </div>


            <div className="p-4 pb-0">
                <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 group"
                >
                    {optimizing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            OPTIMIZING...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} className="group-hover:animate-pulse" />
                            SUGGEST OPTIMIZATIONS
                        </>
                    )}
                </button>
            </div>


            {alerts && alerts.length > 0 && (
                <div className="p-4 bg-black/20 border-b border-white/5">
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
                </div>
            )}


            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, i) => (
                    <div key={i}
                        className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-primary to-green-600 text-black font-medium rounded-br-none ml-auto'
                            : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5 mr-auto'
                            }`}>
                        {msg.content.split('\n').map((line, l) => <p key={l}>{line}</p>)}
                    </div>
                ))}
                {loading && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 ml-2">
                        <Loader2 className="animate-spin" size={12} /> AI is typing...
                    </div>
                )}
            </div>


            <div className="p-4 border-t border-dark-border">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                        placeholder="Ask the AI Operator..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-500"
                    />
                    <button
                        onClick={handleChat}
                        disabled={loading}
                        className="bg-white/10 hover:bg-white/20 text-primary p-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
