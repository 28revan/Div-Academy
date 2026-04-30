import React from 'react';

export default function DetailItem({ label, value, icon, className = "" }) {
  return (
    <div className={`p-4 bg-brand-surface rounded-2xl border border-brand-border group hover:border-brand-orange/30 transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-3 mb-1">
        <div className="p-1.5 bg-brand-orange/10 rounded-lg text-brand-orange group-hover:bg-brand-orange group-hover:text-black transition-all">
          {icon}
        </div>
        <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-sm font-bold text-brand-text truncate pl-9">
        {value}
      </p>
    </div>
  );
}
