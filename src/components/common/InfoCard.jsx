import React from 'react';

export default function InfoCard({ label, value, className = "" }) {
  return (
    <div className={`bg-[#1E1E21] p-3 rounded-2xl border border-[#2C2C30] ${className}`}>
      <p className="text-[7px] md:text-[8px] text-gray-500 uppercase font-black mb-1">{label}</p>
      <p className="text-[9px] md:text-[10px] font-bold text-brand-text truncate">{value || 'Təyin edilməyib'}</p>
    </div>
  );
}
