import React from 'react';
import { UserCheck, UserMinus, GraduationCap, AlertCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Active':
        return { 
          label: 'Aktiv', 
          classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <UserCheck size={10} />
        };
      case 'Frozen':
        return { 
          label: 'Dondurulub', 
          classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <UserMinus size={10} />
        };
      case 'Graduated':
        return { 
          label: 'Məzun', 
          classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          icon: <GraduationCap size={10} />
        };
      case 'PaymentPending':
        return { 
          label: 'Ödəniş Gözlənilir', 
          classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <AlertCircle size={10} />
        };
      default:
        return { 
          label: status, 
          classes: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
          icon: null
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.classes}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
