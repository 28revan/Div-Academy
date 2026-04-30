import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, Search, Filter, LogIn, Upload, PlusCircle, ShieldAlert, Clock, User, Download } from 'lucide-react';
import { ExcelService } from '../services/excelService';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs');
      const data = await response.json();
      setLogs(data.reverse()); // Show newest first
      setLoading(false);
    } catch (error) {
       console.error('Failed to fetch logs:', error);
       setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
      const matchesSearch = log.userName?.toLowerCase().includes(search.toLowerCase()) || 
                           log.description?.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'All' || log.type === filterType;
      return matchesSearch && matchesType;
  });

  const handleExport = () => {
    const dataToExport = filteredLogs.map(l => ({
      'Tarix': new Date(l.timestamp).toLocaleString('az-AZ'),
      'İstifadəçi': l.userName,
      'Email': l.userEmail,
      'Növ': l.type,
      'Əməliyyat': l.description,
      'IP': l.ip || 'Local'
    }));
    ExcelService.exportData(dataToExport, 'LMS_Aktivlik_Hesabat');
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'Login': return <LogIn className="text-emerald-500" size={16} />;
      case 'Task': return <Upload className="text-blue-500" size={16} />;
      case 'Assignment': return <PlusCircle className="text-indigo-500" size={16} />;
      case 'Admin': return <ShieldAlert className="text-red-500" size={16} />;
      default: return <Clock className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-brand-text uppercase tracking-tighter">Sistem Aktivliyi</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">İstifadəçi hərəkətləri və sistem jurnalı</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-brand-orange text-brand-dark px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-brand-orange/20"
        >
          <Download size={16} />
          Hesabatı Yüklə
        </button>
      </div>

      {/* Filters */}
      <div className="bg-brand-card p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-brand-border flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text"
            placeholder="Axtar..."
            className="w-full bg-brand-surface border border-brand-border rounded-2xl pl-11 pr-4 py-2.5 text-xs md:text-sm focus:border-brand-orange outline-none text-brand-text placeholder:text-gray-600 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:items-center gap-2">
          {['All', 'Login', 'Task', 'Assignment', 'Admin'].map((type, idx) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center whitespace-nowrap ${
                filterType === type 
                  ? 'bg-brand-orange text-brand-dark shadow-lg shadow-brand-orange/20' 
                  : 'bg-brand-surface text-gray-500 hover:text-brand-text border border-brand-border'
              } ${idx === 4 ? 'col-span-2 md:col-span-1 lg:col-span-auto' : ''}`}
            >
              {type === 'All' ? 'Hamısı' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-brand-card rounded-[24px] md:rounded-[32px] border border-brand-border p-4 md:p-8 relative overflow-hidden">
        <div className="absolute left-12 top-0 bottom-0 w-px bg-brand-border/50 hidden md:block" />
        
        <div className="space-y-6 md:space-y-8 relative">
          {filteredLogs.map((log, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              key={log.id || index}
              className="flex flex-col md:flex-row gap-2 md:gap-12 relative"
            >
              {/* Node Icon */}
              <div className="hidden md:flex absolute left-[-2px] w-1 h-1 rounded-full bg-brand-orange shadow-[0_0_10px_rgba(223,255,0,0.5)] z-10" />
              
              {/* Date Column */}
              <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0 md:w-32 shrink-0">
                <p className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  {new Date(log.timestamp).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <span className="md:hidden text-gray-700">•</span>
                <p className="text-[8px] md:text-[8px] font-bold text-gray-500 uppercase md:mt-0.5">
                  {new Date(log.timestamp).toLocaleDateString('az-AZ')}
                </p>
              </div>

              {/* Content Card */}
              <div className="flex-1 bg-brand-surface/40 border border-brand-border p-4 md:p-5 rounded-2xl group hover:border-brand-orange/30 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-card rounded-lg border border-brand-border group-hover:border-brand-orange/20 transition-all shrink-0">
                      {getLogIcon(log.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-brand-text truncate">{log.userName}</span>
                        <span className="text-[7px] font-black bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0">
                          {log.userRole || 'User'}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-500 font-mono truncate">{log.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl shadow-lg shadow-red-500/5">
                      <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Silinməyə:</span>
                      <span className="text-[10px] font-black text-white">
                        {Math.max(0, 30 - Math.floor((new Date() - new Date(log.timestamp)) / (1000 * 60 * 60 * 24)))} gün
                      </span>
                    </div>
                    <div className="hidden sm:block text-right">
                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">IP Adresi</span>
                      <p className="text-[9px] font-mono text-gray-500">{log.ip || '127.0.0.1'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pl-6 md:pl-12 border-l border-brand-orange/10 mt-2">
                   <p className="text-[10px] md:text-[11px] text-[#E2E2E2] leading-relaxed">
                     {log.description}
                   </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-brand-surface rounded-3xl border border-brand-border flex items-center justify-center mx-auto mb-4 text-gray-600">
                <History size={32} />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Aktivlik tapılmadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
