import React from 'react';

export default function StatCard({ label, value, sub, icon, isCritical }) {
  return (
    <div className={`bg-[#161619] p-6 rounded-3xl border ${isCritical ? 'border-red-900/30' : 'border-[#242427]'} shadow-sm relative overflow-hidden group transition-all hover:bg-[#1E1E21]`}>
      <div className="flex justify-between items-start relative z-10 text-left">
        <div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
             <p className={`text-xl sm:text-2xl lg:text-3xl font-black ${isCritical ? 'text-red-400' : 'text-[#E2E2E2]'}`}>{value}</p>
          </div>
          <p className="text-[8px] sm:text-[10px] text-gray-500 mt-2 font-black uppercase tracking-tighter opacity-70">{sub}</p>
        </div>
        <div className={`p-3 rounded-2xl ${isCritical ? 'bg-red-500/10' : 'bg-brand-orange/5'} border border-white/5 group-hover:border-brand-orange/30 transition-all`}>
           {icon}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 transition-all duration-700 ${isCritical ? 'bg-red-500' : 'bg-brand-orange'} w-0 group-hover:w-full`}></div>
    </div>
  );
}
