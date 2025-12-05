import React from 'react';
import { Database, Wind, Zap } from 'lucide-react';

const TurbineCard = ({ name, type, adm, pwr, sout }) => {
    const isActive = pwr > 1;

    const cons = pwr > 0 ? (adm / pwr).toFixed(2) : "-";

    return (
        <div className="relative w-40">



            <div
                className="relative bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-gray-600 h-48 flex flex-col justify-between p-2 shadow-xl overflow-hidden rounded-xl"
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)' }}
            >

                <div className="flex justify-between items-center border-b border-dark-border pb-1 px-2">
                    <span className="font-bold text-xs text-gray-300">{name}</span>
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_5px_#00FF94]' : 'bg-gray-600'}`}></div>
                </div>


                <div className="flex-1 flex flex-col justify-center px-3">
                    {type !== 'Cond' && (
                        <div className="flex justify-between">
                            <span className="text-[9px] text-text-muted">IN (HP)</span>
                            <span className="font-mono text-secondary text-sm font-bold">{adm}</span>
                        </div>
                    )}
                    <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-text-muted">OUT (EP)</span>
                        <span className="font-mono text-primary text-sm font-bold">{(pwr || 0).toFixed(1)}</span>
                    </div>
                    {type === 'Ext' && (
                        <div className="flex justify-between mt-1">
                            <span className="text-[9px] text-text-muted">OUT (MP)</span>
                            <span className="font-mono text-warning text-sm font-bold">{(sout || 0).toFixed(1)}</span>
                        </div>
                    )}
                </div>


                {type !== 'Cond' && (
                    <div className="bg-black/40 rounded-lg p-1 text-center border border-white/10 mx-2 mb-1 backdrop-blur-sm">
                        <div className="text-[9px] text-text-muted">CONSUMPTION</div>
                        <div className="font-mono text-xs text-orange-400">{cons}</div>
                    </div>
                )}
            </div>


            {type === 'Ext' && (
                <div className="absolute -bottom-16 left-1/2 -ml-1 w-2 h-16 bg-secondary border-x border-cyan-500 z-0 steam-pipe-hp shadow-[0_0_10px_rgba(45,156,219,0.6)]"></div>
            )}

            {type === 'Cond' && (
                <div className="absolute -bottom-16 left-1/2 -ml-1 w-2 h-16 bg-secondary border-x border-cyan-500 z-0 steam-pipe-hp shadow-[0_0_10px_rgba(45,156,219,0.6)]"></div>
            )}
        </div>
    );
};

const GridCard = ({ name, val }) => (
    <div className="text-center px-6 py-2 border-l border-white/10 first:border-0 flex flex-col items-center">
        <div className="text-xs font-bold text-text-muted mb-1 flex items-center gap-2">
            <Zap size={12} className="text-yellow-500" /> {name} (Grid)
        </div>
        <div className="font-mono text-xl text-[#F2C94C]">{val.toFixed(1)}</div>
        <div className="text-[10px] text-gray-600">MVA Apparent Power</div>
    </div>
);

export default function DigitalTwin({ data, inputs }) {

    const flowSpeed = Math.max(0.5, 3 - (inputs.sulfur_in / 100));

    const vapDispo = data?.meta?.vap_dispo ?? 0;

    return (
        <main className="flex-1 flex flex-col relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">


            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-10">

                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                </div>


                {data && (
                    <div className="relative w-full max-w-5xl flex flex-col items-center gap-12 z-0">


                        <div className="flex items-center justify-center gap-8 relative">

                            <div className="w-32 h-24 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-2xl flex flex-col items-center justify-center p-2 shadow-lg">
                                <Database size={24} className="text-yellow-500 mb-2" />
                                <span className="font-bold text-yellow-500 text-center leading-tight">SULFURIC ACID</span>
                                <span className="font-mono text-xs text-text-muted mt-1">{inputs.sulfur_in.toFixed(0)} T/h</span>
                            </div>


                            <div className="w-16 h-1 bg-yellow-500"></div>


                            <div className="w-40 h-24 border-2 border-warning bg-gradient-to-br from-[#3d2c1d] to-[#5d3a22] rounded-2xl flex flex-col items-center justify-center relative shadow-[0_0_25px_rgba(242,153,74,0.4)]">
                                <span className="text-warning font-bold text-lg mb-1">BOILER</span>
                                <span className="font-mono text-xs text-text-muted">Gen: {data.meta.est_steam_gen.toFixed(0)} T/h</span>

                                <div
                                    className="absolute -bottom-12 left-1/2 -ml-0.5 w-1 h-12 bg-[#F2994A] steam-pipe-hp"
                                    style={{ animationDuration: `${flowSpeed}s` }}
                                ></div>
                            </div>
                        </div>


                        <div
                            className="w-full h-2 bg-[#F2994A] rounded relative steam-pipe-hp"
                            style={{ animationDuration: `${flowSpeed}s` }}
                        >

                            <div className="absolute top-2 left-[8.33%] w-1 h-10 bg-[#F2994A] steam-pipe-hp" style={{ animationDuration: `${flowSpeed}s` }}></div>
                            <div className="absolute top-2 left-[25%] w-1 h-10 bg-[#F2994A] steam-pipe-hp" style={{ animationDuration: `${flowSpeed}s` }}></div>
                            <div className="absolute top-2 left-[41.66%] w-1 h-10 bg-[#F2994A] steam-pipe-hp" style={{ animationDuration: `${flowSpeed}s` }}></div>
                            <div className="absolute top-2 left-[58.33%] w-1 h-10 bg-[#F2994A] steam-pipe-hp" style={{ animationDuration: `${flowSpeed}s` }}></div>
                            <div className="absolute top-2 left-[75%] w-1 h-10 bg-[#F2994A] steam-pipe-hp" style={{ animationDuration: `${flowSpeed}s` }}></div>
                            <div className="absolute top-2 left-[91.66%] w-1 h-10 bg-[#F2994A] steam-pipe-hp" style={{ animationDuration: `${flowSpeed}s` }}></div>
                        </div>


                        <div className="flex justify-center gap-8 w-full items-start">
                            <TurbineCard name="GTA 1" type="Ext" adm={inputs.adm1} pwr={data.P_GTA1} sout={data.Sout1} />
                            <TurbineCard name="GTA 2" type="Ext" adm={inputs.adm2} pwr={data.P_GTA2} sout={data.Sout2} />
                            <TurbineCard name="GTA 3" type="Ext" adm={inputs.adm3} pwr={data.P_GTA3} sout={data.Sout3} />


                            <div className="relative w-32 mx-4">
                                <div className="h-40 border border-secondary bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-2 flex flex-col items-center justify-around shadow-xl">
                                    <span className="text-xs font-bold text-secondary">TURBO</span>
                                    <Wind className="text-gray-500 animate-spin-slow" size={32} />
                                    <div className="text-right w-full">
                                        <div className="text-[10px] text-text-muted">HP IN</div>
                                        <div className="font-mono text-warning text-xs">{data.HP_TR.toFixed(0)}</div>
                                    </div>
                                </div>

                                <div className="absolute -bottom-24 left-1/2 -ml-1 w-2 h-24 bg-secondary border-x border-cyan-500 z-0 steam-pipe-hp shadow-[0_0_10px_rgba(45,156,219,0.6)]"></div>
                            </div>

                            <TurbineCard name="GTA A" type="Cond" adm={0} pwr={data.P_GTAA} sout={0} />
                            <TurbineCard name="GTA B" type="Cond" adm={0} pwr={data.P_GTAB} sout={0} />
                        </div>


                        <div className="w-full h-16 rounded-full border-2 border-secondary bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] flex items-center justify-center relative shadow-[0_0_25px_rgba(45,156,219,0.3)] z-10 mt-4">



                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-4">
                                    <span className="text-secondary font-bold tracking-widest text-lg">MP STEAM COLLECTOR</span>
                                    <span className="font-mono text-gray-400 text-sm">{((data.Sout1 || 0) + (data.Sout2 || 0) + (data.Sout3 || 0) + (data.MP_TR || 0)).toFixed(1)} T/h</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 border-l border-secondary/30">
                                    <span className="text-xs text-text-muted">PRESSURE:</span>
                                    <span className="font-mono text-secondary font-bold">{data.MP_Pressure.toFixed(2)} bar</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 border-l border-secondary/30">
                                    <span className="text-xs text-text-muted">CAP CONS:</span>
                                    <span className="font-mono text-secondary font-bold">{data.MP_TR.toFixed(1)} T/h</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 border-l border-secondary/30">
                                    <span className="text-xs text-text-muted">AVAIL MP:</span>
                                    <span className="font-mono text-green-400 font-bold">{vapDispo.toFixed(1)} T/h</span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>


            {data && (
                <div className="h-24 border-t border-white/10 bg-black/30 backdrop-blur-md flex items-center justify-center gap-12">
                    <GridCard name="TR 1" val={data.TR1} />
                    <GridCard name="TR 2" val={data.TR2} />
                    <GridCard name="TR 3" val={data.TR3} />
                </div>
            )}
        </main>
    );
}
