import React from 'react';
import { Zap, Activity, Wind } from 'lucide-react';

const KPICard = ({ title, value, unit, icon: Icon, color }) => (
  <div className={`bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-2xl border border-white/5 shadow-lg flex items-center gap-4 relative overflow-hidden group hover:scale-105 transition-transform duration-300`}>
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-${color}-500/20`}></div>
    <div className={`p-3 rounded-xl bg-${color}-500/20 text-${color}-500`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-bold tracking-wider uppercase">{title}</p>
      <p className="text-2xl font-mono font-bold text-white mt-1">
        {value} <span className="text-sm text-gray-500 font-sans">{unit}</span>
      </p>
    </div>
  </div>
);

export default function KPIHeader({ data }) {
  return (
    <header className="h-24 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-white/10 flex items-center px-8 shadow-md z-10">
      <div className="flex items-center gap-8 w-full max-w-7xl mx-auto">
        <KPICard
          title="Total Generation"
          value={data?.meta?.total_power ? data.meta.total_power.toFixed(1) : '--'}
          unit="MW"
          color="green"
          icon={Zap}
        />
        <KPICard
          title="MP Pressure"
          value={data?.MP_Pressure ? data.MP_Pressure.toFixed(2) : '--'}
          unit="bar"
          color="orange"
          icon={Activity}
        />
        <KPICard
          title="Total MP Steam"
          value={data ? (data.Sout1 + data.Sout2 + data.Sout3 + data.MP_TR).toFixed(1) : '--'}
          unit="T/h"
          color="purple"
          icon={Wind}
        />
        <KPICard
          title="Global Efficiency"
          value={data?.meta?.global_efficiency ? data.meta.global_efficiency.toFixed(1) : "--"}
          unit="%"
          color="blue"
          icon={Wind}
        />
      </div>
    </header>
  );
}
