import React from 'react';

export default function StatItem({ label, value, border, colorClass = "text-[#E2E2E2]" }) {
  return (
    <div className={`text-center flex-1 ${border ? 'border-r border-[#242427]' : ''}`}>
      <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-black">{label}</p>
      <p className={`text-base md:text-lg font-black font-mono ${colorClass}`}>{value}</p>
    </div>
  );
}
