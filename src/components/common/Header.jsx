import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export default function Header({ title, user }) {
  return (
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
      <div className="w-full lg:w-auto">
        <h2 className="text-3xl font-black tracking-tighter text-brand-text uppercase leading-none">
          {title} <span className="text-brand-orange">.</span>
        </h2>
        <p className="text-gray-500 font-medium mt-1 tracking-tight">
          Xoş gəlmisiniz, <span className="text-brand-text font-black">{user.name}</span>!
        </p>
      </div>

      <div className="flex items-center gap-4 bg-brand-surface/50 px-6 py-4 rounded-3xl border border-brand-border/50 group hover:border-brand-orange/20 transition-all">
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest leading-none">Status</span>
          <span className="text-[11px] font-black uppercase text-brand-orange mt-1">Sistem Aktivdir</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse shadow-[0_0_10px_rgba(223,255,0,0.4)]"></div>
      </div>
    </header>
  );
}
