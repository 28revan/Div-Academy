import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, ChevronLeft, ChevronRight, Check, X, AlertCircle } from 'lucide-react';
import { ExcelService } from '../../services/excelService';

export default function GroupJournal({ group, students, currentUser, customBack }) {
  const [attendance, setAttendance] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editableDate, setEditableDate] = useState(null);
  const [tempChanges, setTempChanges] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [group.id]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/attendance/${group.id}`);
      if (res.ok) {
        setAttendance(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isAdmin = currentUser.role.toLowerCase() === 'admin';
  
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysCount = getDaysInMonth(year, month);
  
  const daysArray = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(year, month, i + 1);
    // Convert to strict YYYY-MM-DD
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Map attendance log entries by date
  // A log object might have date: '2026-05-05' or '2026-05-05T...'
  const getDailyRecords = (dateStr) => {
    return attendance.find(a => a.date.startsWith(dateStr));
  };

  const handleExport = () => {
    // Generate Excel data
    const exportData = students.map(student => {
      const row = { 'Tələbə Adı': student.name };
      daysArray.forEach(dateStr => {
        const log = getDailyRecords(dateStr);
        let status = '';
        if (log) {
          const rec = log.records.find(r => r.studentId === student.uid);
          status = rec?.status === 'present' ? 'i/e' : (rec?.status === 'absent' ? 'q' : '');
        }
        row[dateStr] = status;
      });
      return row;
    });

    ExcelService.exportData(exportData, `Davamiyyət_Jurnalı_${group.name}_${year}_${month+1}`);
  };

  const handleToggleCell = (studentId, dateStr) => {
    // Check permissions
    if (!isAdmin) {
      // Mentors/Teachers can only edit today
      if (dateStr !== todayStr) return;
      
      // If a log already exists for today, they cannot edit it!
      const existingLog = getDailyRecords(dateStr);
      if (existingLog) return; // Locked
    }

    // Set editable view for that date column
    setEditableDate(dateStr);

    const key = `${studentId}_${dateStr}`;
    const currentValue = tempChanges[key] !== undefined ? tempChanges[key] : (getDailyRecords(dateStr)?.records.find(r => r.studentId === studentId)?.status || 'empty');
    
    // Cycle logic: empty -> present -> absent -> empty
    let nextVal = 'present';
    if (currentValue === 'present') nextVal = 'absent';
    else if (currentValue === 'absent') nextVal = 'empty';

    setTempChanges(prev => ({ ...prev, [key]: nextVal }));
  };

  const handleSaveColumn = async (dateStr) => {
    setLoading(true);
    // Gather all students for that date
    const records = students.map(student => {
      const key = `${student.uid}_${dateStr}`;
      const existing = getDailyRecords(dateStr)?.records.find(r => r.studentId === student.uid)?.status;
      const status = tempChanges[key] !== undefined ? tempChanges[key] : (existing || 'absent'); 
      return {
        studentId: student.uid,
        status: status === 'empty' ? 'absent' : status // Final default is absent
      };
    });

    try {
      const res = await fetch(`/api/attendance/${group.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, records }) // use exact dateStr like 2026-05-05
      });
      if (res.ok) {
        await fetchAttendance();
        setEditableDate(null);
        // Clear temp changes for this date
        const newTemp = { ...tempChanges };
        Object.keys(newTemp).forEach(k => {
          if (k.endsWith(`_${dateStr}`)) delete newTemp[k];
        });
        setTempChanges(newTemp);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const canSaveColumn = (dateStr) => {
    if (!isAdmin && dateStr !== todayStr) return false;
    if (!isAdmin && getDailyRecords(dateStr)) return false;
    return true;
  };

  const isMonthEnd = () => {
    const todayDate = new Date();
    return todayDate.getFullYear() === year && todayDate.getMonth() === month && todayDate.getDate() >= daysCount - 2;
  };

  return (
    <div className="space-y-6">
      {customBack && (
        <div className="pb-2">
          {customBack}
        </div>
      )}
      
      <div className="bg-brand-card p-6 rounded-3xl border border-brand-border flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-brand-text uppercase">
            Elektron Jurnal: {group.name}
          </h3>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:text-brand-orange text-gray-500 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-gray-400 uppercase w-32 text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:text-brand-orange text-gray-500 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isMonthEnd() && (
             <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mr-4 animate-pulse">
               <AlertCircle size={14} /> Ay sonudur cədvəli çıxarın
             </div>
          )}
          <button 
            onClick={handleExport}
            className="bg-brand-surface border border-brand-border text-brand-text px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand-orange transition-all flex items-center gap-2"
          >
            <Download size={16} className="text-brand-orange" /> Excel Eksport
          </button>
        </div>
      </div>

      <div className="bg-brand-card rounded-3xl border border-brand-border overflow-hidden p-6 w-full max-w-full overflow-x-auto relative">
         <table className="w-auto text-left border-collapse min-w-max">
           <thead>
             <tr className="border-b border-brand-border">
                <th className="px-4 py-3 text-[10px] font-black text-brand-orange uppercase sticky left-0 bg-brand-card z-20 border-r border-brand-border">
                  Tələbə
                </th>
                {daysArray.map(dStr => {
                  const dObj = new Date(dStr);
                  const isToday = dStr === todayStr;
                  return (
                    <th key={dStr} className={`px-2 py-3 text-center border-r border-[#1E1E21] min-w-[36px] ${isToday ? 'bg-brand-orange/10' : ''}`}>
                       <div className="flex flex-col items-center gap-1">
                          <span className={`text-[8px] font-black uppercase ${isToday ? 'text-brand-orange' : 'text-gray-500'}`}>{dStr.substring(8, 10)}</span>
                          <span className="text-[7px] font-black uppercase text-gray-600">{dStr.substring(5, 7)}</span>
                       </div>
                       
                       {/* Column Save logic */}
                       {editableDate === dStr && canSaveColumn(dStr) && (
                         <button 
                           onClick={() => handleSaveColumn(dStr)}
                           disabled={loading}
                           className="mt-2 w-full p-1 bg-green-500 rounded text-white flex justify-center hover:bg-green-400 disabled:opacity-50"
                         >
                           <Check size={12} />
                         </button>
                       )}
                    </th>
                  );
                })}
             </tr>
           </thead>
           <tbody>
             {students.map(student => (
               <tr key={student.uid} className="border-b border-brand-border/50 hover:bg-brand-surface/30">
                  <td className="px-4 py-2 text-xs font-bold text-brand-text sticky left-0 bg-brand-card z-10 border-r border-brand-border whitespace-nowrap">
                    {student.name}
                  </td>
                  {daysArray.map(dStr => {
                    const isToday = dStr === todayStr;
                    const log = getDailyRecords(dStr);
                    const isLockedForRole = !isAdmin && (dStr !== todayStr || log);
                    
                    const key = `${student.uid}_${dStr}`;
                    let status = log?.records.find(r => r.studentId === student.uid)?.status || 'empty';
                    if (tempChanges[key] !== undefined) status = tempChanges[key];

                    return (
                      <td 
                        key={dStr} 
                        className={`px-1 py-1 text-center border-r border-[#1E1E21] cursor-pointer transition-colors
                          ${isToday && !log && !isAdmin ? 'bg-brand-orange/5 hover:bg-brand-orange/10' : ''}
                          ${!isLockedForRole ? 'hover:bg-brand-surface' : 'cursor-not-allowed'}
                        `}
                        onClick={() => handleToggleCell(student.uid, dStr)}
                      >
                        <div className="flex items-center justify-center w-full h-8">
                           {status === 'present' && <Check size={16} className="text-green-500" />}
                           {status === 'absent' && <X size={16} className="text-red-500" />}
                           {status === 'empty' && <span className="w-1 h-1 bg-gray-700 rounded-full"></span>}
                        </div>
                      </td>
                    );
                  })}
               </tr>
             ))}
           </tbody>
         </table>
      </div>
      
      {!isAdmin && (
        <p className="text-[10px] text-gray-500 italic uppercase">
          * Qeyd: Siz yalnız bugünkü dərsin iştirakçılarını (<strong>{todayStr}</strong>) qeyd edə bilərsiniz. Yadda saxladıqdan sonra dəyişiklik edilə bilməz. Cədvəldə düzəliş üçün Adminə müraciət edin.
        </p>
      )}
    </div>
  );
}
