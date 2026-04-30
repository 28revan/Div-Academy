import React from 'react';
import { Edit2 } from 'lucide-react';

import InfoCard from './InfoCard';
import StatItem from './StatItem';

export default function GroupCard({ group, onEdit, teachers, mentors }) {
  const isHealthy = group.avgGrade > 80;
  const teacher = teachers?.find(t => t.uid === group.teacherId);
  const mentor = mentors?.find(m => m.uid === group.mentorId);
  
  return (
    <div className={`bg-[#161619] p-6 rounded-3xl border-2 shadow-xl ${isHealthy ? 'border-[#242427]' : 'border-yellow-500/30 shadow-yellow-500/5'} relative group overflow-hidden flex flex-col justify-between text-left`}>
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg md:text-xl font-black text-[#E2E2E2] group-hover:text-brand-orange transition-colors uppercase tracking-tight truncate mr-2">{group.name}</h4>
          <button 
            onClick={onEdit}
            className="p-1.5 md:p-2 bg-[#2C2C30] rounded-lg text-gray-500 hover:text-brand-orange transition-all flex-shrink-0"
          >
            <Edit2 size={14} className="md:w-4 md:h-4" />
          </button>
        </div>
        <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-black tracking-widest">{isHealthy ? 'SAĞLAM QRUP' : 'RİSKLİ QRUP - DİQQƏT'}</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <InfoCard label="Trainer" value={teacher?.name} />
          <InfoCard label="Mentor" value={mentor?.name} />
        </div>

        <div>
          <div className="flex justify-between text-[8px] md:text-[10px] uppercase font-black text-gray-500 mb-2">
            <span>Tədris Proqresi</span>
            <span className="text-[#E2E2E2] font-black">{group.progress}%</span>
          </div>
          <div className="h-1 bg-[#1E1E21] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isHealthy ? 'bg-brand-orange' : 'bg-yellow-500'}`} 
              style={{ width: `${group.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-[#1E1E21] p-2 md:p-3 rounded-2xl border border-[#2C2C30]">
           <StatItem 
             label="Bal" 
             value={group.avgGrade} 
             border 
             colorClass={isHealthy ? 'text-brand-orange' : 'text-yellow-400'} 
           />
           <StatItem 
             label="Davam" 
             value={`${group.avgAttendance || 85}%`} 
             border 
           />
           <StatItem 
             label="Tələbə" 
             value={group.students?.length || 0} 
           />
        </div>

        {group.lessonHours && (
           <div className="bg-[#1E1E21] px-4 py-2 rounded-xl border border-[#2C2C30] flex justify-between items-center">
              <p className="text-[9px] text-gray-500 uppercase font-black">Dərs saatları</p>
              <p className="text-[10px] font-bold text-brand-orange">{group.lessonHours}</p>
           </div>
        )}
        {group.syllabusUrl && (
           <a 
             href={group.syllabusUrl} 
             target="_blank" 
             rel="noreferrer"
             className="block text-center text-[10px] font-black uppercase tracking-widest text-[#E2E2E2] bg-[#2C2C30] py-2 rounded-xl hover:bg-brand-orange hover:text-brand-dark transition-all"
           >
             Sillabusu Görüntülə
           </a>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[#242427] flex gap-2">
        <button className="flex-1 text-[10px] font-black uppercase tracking-widest bg-brand-orange/10 text-brand-orange py-2.5 rounded-xl border border-brand-orange/20 hover:bg-brand-orange hover:text-brand-dark transition-all">
          Journal
        </button>
        <button className="flex-1 text-[10px] font-black uppercase tracking-widest bg-[#2C2C30] text-gray-400 py-2.5 rounded-xl hover:text-[#E2E2E2] transition-all">
          Detallar
        </button>
      </div>
    </div>
  );
}
