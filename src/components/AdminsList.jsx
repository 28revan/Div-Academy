import React, { useState } from 'react';
import { Mail, Shield, Phone, Calendar } from 'lucide-react';
import Header from './common/Header';
import { AuthService } from '../services/authService';

const ADMINS = [
  { id: 1, name: 'Revan Aliyev', email: 'revan@div.edu.az', phone: '+994 50 123 45 67', role: 'Head Admin', joined: '2023-01-15' },
  { id: 2, name: 'Kamran Həsənov', email: 'kamran@div.edu.az', phone: '+994 55 987 65 43', role: 'System Admin', joined: '2023-03-20' },
  { id: 3, name: 'Lalə Məmmədova', email: 'lala@div.edu.az', phone: '+994 70 456 78 90', role: 'Education Admin', joined: '2024-02-10' },
];

export default function AdminsList() {
  const [user] = useState(AuthService.getCurrentUser());
  
  return (
    <div className="space-y-8">
      <Header title="Admin Heyəti" user={user} />
      
      <div>
        <p className="text-gray-500 mt-1 font-medium italic">Sistemin idarə olunmasına cavabdeh şəxslərin siyahısı.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ADMINS.map(admin => (
          <div key={admin.id} className="bg-[#161619] border border-[#242427] rounded-3xl p-6 hover:border-brand-orange/50 transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-brand-orange/10 transition-all"></div>
             
             <div className="relative z-10">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center font-black text-brand-orange text-xl">
                    {admin.name.charAt(0)}
                 </div>
                 <div>
                    <h3 className="font-bold text-lg text-[#E2E2E2]">{admin.name}</h3>
                    <div className="flex items-center gap-1.5 text-brand-orange text-[10px] font-black uppercase tracking-widest">
                       <Shield size={10} />
                       {admin.role}
                    </div>
                 </div>
               </div>

               <div className="space-y-3">
                 <div className="flex items-center gap-3 text-xs text-gray-400">
                    <Mail size={14} className="text-gray-600" />
                    {admin.email}
                 </div>
                 <div className="flex items-center gap-3 text-xs text-gray-400">
                    <Phone size={14} className="text-gray-600" />
                    {admin.phone}
                 </div>
                 <div className="flex items-center gap-3 text-xs text-gray-400">
                    <Calendar size={14} className="text-gray-600" />
                    Qatıldı: {admin.joined}
                 </div>
               </div>

               <div className="mt-8 pt-6 border-t border-[#242427]">
                  <button className="w-full py-2.5 bg-[#1E1E21] border border-[#2C2C30] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-orange hover:border-brand-orange/50 transition-all">
                    Profilə Bax
                  </button>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
