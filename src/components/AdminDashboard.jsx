import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  UserPlus, Search, Download, Edit2, Check, X, Plus,
  MoreVertical, ChevronDown, ChevronUp, Filter, 
  TrendingUp, Wallet, Users as UsersIcon, LayoutGrid, 
  List, GraduationCap, AlertTriangle, FileSpreadsheet, Shield,
  BookOpen, Target, Settings, Briefcase, Zap, Star, Globe, LogOut, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Role, StudentStatus } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import Header from './common/Header';
import StatusBadge from './common/StatusBadge';
import DetailItem from './common/DetailItem';
import StatCard from './common/StatCard';
import GroupCard from './common/GroupCard';
import AddModal from './common/AddModal';
import EditUserModal from './common/EditUserModal';
import { ExcelService } from '../services/excelService';
import { AuthService } from '../services/authService';

export default function AdminDashboard() {
  const location = useLocation();
  const [user] = useState(AuthService.getCurrentUser());
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('panel'); // panel, students, teachers, mentors, groups
  const [viewMode, setViewMode] = useState('table');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/admin') setActiveMainTab('panel');
    else if (path.includes('users')) setActiveMainTab('students');
    else if (path.includes('teachers')) setActiveMainTab('teachers');
    else if (path.includes('mentors')) setActiveMainTab('mentors');
    else if (path.includes('groups')) setActiveMainTab('groups');
  }, [location.pathname]);

  const fetchData = async () => {
    try {
      const [uRes, gRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/groups')
      ]);
      const uData = await uRes.json();
      const gData = await gRes.json();
      setUsers(uData);
      setGroups(gData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (groupId, updates) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedGroup = await res.json();
        setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
        setEditingGroup(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (uid, updates) => {
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.error || 'Yenilənmədi');
      }
      fetchData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!window.confirm('Bu istifadəçini silmək istədiyinizə əminsiniz?')) return;
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: 'Admin' })
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.error || 'Silinmədi');
      }
      fetchData();
      setSelectedIds(prev => prev.filter(id => id !== uid));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Silmə zamanı xəta baş verdi');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Bu qrupu silmək istədiyinizə əminsiniz?')) return;
    try {
      const res = await fetch(`/api/admin/groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deletedBy: 'Admin' })
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.error || 'Silinmədi');
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                           u.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === 'All' || u.status === filterStatus;
      
      let matchesRole = u.role === Role.Student;
      if (activeMainTab === 'teachers') matchesRole = u.role === Role.Teacher;
      if (activeMainTab === 'mentors') matchesRole = u.role === Role.Mentor;
      
      return matchesRole && matchesSearch && (activeMainTab === 'students' ? matchesFilter : true);
    });
  }, [users, search, filterStatus, activeMainTab]);

  const stats = useMemo(() => {
    const students = users.filter(u => u.role === Role.Student);
    return {
      total: students.length,
      active: students.filter(u => u.status === StudentStatus.Active).length,
      graduated: students.filter(u => u.status === StudentStatus.Graduated).length,
      debtors: students.filter(u => u.status === StudentStatus.PaymentPending).length,
      attendance: 94, // Mock
      paymentSum: students.reduce((acc, curr) => acc + (curr.balance < 0 ? Math.abs(curr.balance) : 0), 0)
    };
  }, [users]);

  const exportToExcel = (customData = null) => {
    const dataToExport = customData || filteredUsers.map(u => ({
      'Ad Soyad': u.name,
      'Email': u.email,
      'FIN': u.fin,
      'Universitet': u.university,
      'İxtisas': u.specialty,
      'Status': u.status,
      'Davamiyyət': (u.attendance || 0) + '%',
      'Maliyyə': u.balance + ' AZN'
    }));

    ExcelService.exportData(dataToExport, `Div_Academy_${activeMainTab}_Hesabat`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) setSelectedIds([]);
    else setSelectedIds(filteredUsers.map(u => u.uid));
  };

  const toggleSelect = (uid) => {
    setSelectedIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const getAccentStyles = () => {
    switch (activeMainTab) {
      case 'students': return { text: 'text-brand-orange', bg: 'bg-brand-orange', bgLight: 'bg-brand-orange/10', border: 'border-brand-orange', borderLight: 'border-brand-orange/20', shadow: 'shadow-brand-orange/20' };
      case 'teachers': return { text: 'text-emerald-500', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', border: 'border-emerald-500', borderLight: 'border-emerald-500/20', shadow: 'shadow-emerald-500/20' };
      case 'mentors': return { text: 'text-indigo-500', bg: 'bg-indigo-500', bgLight: 'bg-indigo-500/10', border: 'border-indigo-500', borderLight: 'border-indigo-500/20', shadow: 'shadow-indigo-500/20' };
      case 'groups': return { text: 'text-amber-500', bg: 'bg-amber-500', bgLight: 'bg-amber-500/10', border: 'border-amber-500', borderLight: 'border-amber-500/20', shadow: 'shadow-amber-500/20' };
      default: return { text: 'text-brand-orange', bg: 'bg-brand-orange', bgLight: 'bg-brand-orange/10', border: 'border-brand-orange', borderLight: 'border-brand-orange/20', shadow: 'shadow-brand-orange/20' };
    }
  };

  const accent = getAccentStyles();

  return (
    <div className="space-y-6 md:space-y-10">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 lg:mb-12">
        <motion.div
          key={activeMainTab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-0.5 w-8 ${accent.bg} rounded-full opacity-60`} />
            <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${accent.text}/80`}>Div Academy / LMS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tighter text-brand-text uppercase mb-3 leading-tight">
            {activeMainTab === 'panel' ? 'Ümumi İcmal' :
              activeMainTab === 'students' ? 'Tələbə Portalı' : 
              activeMainTab === 'teachers' ? 'Müəllim Heyəti' : 
              activeMainTab === 'mentors' ? 'Mentor Şəbəkəsi' : 'Qrup İdarəetməsi'}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium tracking-tight leading-relaxed max-w-xl">
            {activeMainTab === 'panel' ? 'Sistem üzrə əsas statistik göstəricilər və qısa icmal.' :
              activeMainTab === 'students' ? 'Bütün tələbələrin idarəetmə və hesabat modulu.' : 
              activeMainTab === 'teachers' ? 'Akademik müstəvidə fəaliyyət göstərən trenerlərin siyahısı.' : 
              activeMainTab === 'mentors' ? 'Tələbə inkişafına dəstək olan mentorların mərkəzi.' : 'Dərs qruplarının, cədvəllərin və sillabusların tənzimlənməsi.'}
          </p>
        </motion.div>

        {activeMainTab !== 'panel' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button 
                onClick={() => exportToExcel()}
                className="flex items-center justify-center gap-2.5 px-6 lg:px-8 py-3.5 bg-brand-surface border border-brand-border text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-card hover:border-brand-orange/30 hover:text-brand-text transition-all group"
            >
              <FileSpreadsheet size={16} className="text-green-500/80 group-hover:scale-110 transition-transform" />
              <span>Hesabat</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className={`flex items-center justify-center gap-2.5 px-8 lg:px-10 py-3.5 ${accent.bg} text-brand-dark rounded-2xl text-[10px] font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl ${accent.shadow} uppercase tracking-widest`}
            >
              <Plus size={18} strokeWidth={3} />
              <span>Yeni {activeMainTab === 'students' ? 'Tələbə' : activeMainTab === 'teachers' ? 'Müəllim' : activeMainTab === 'mentors' ? 'Mentor' : 'Qrup'}</span>
            </button>
          </div>
        )}
      </header>

        {activeMainTab === 'panel' ? (
          <div className="space-y-8 md:space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
              <StatCard 
                label="Bütöv Tələbə Kontingenti" 
                value={stats.total} 
                sub={`${stats.active} Fəal / ${stats.graduated} Məzun`}
                icon={<UsersIcon className="text-brand-orange" size={20} />}
              />
              <StatCard 
                label="Fəal Tədris Qrupları" 
                value={groups.length} 
                sub="Bütün istiqamətlər"
                icon={<BookOpen className="text-emerald-500" size={20} />}
              />
              <StatCard 
                label="Akademik Heyət" 
                value={users.filter(u => u.role === Role.Teacher).length} 
                sub="İxtisaslaşmış trenerlər"
                icon={<Briefcase className="text-indigo-500" size={20} />}
              />
              <StatCard 
                label="Akademik Göstərici" 
                value={`${stats.attendance}%`} 
                sub="Davamiyyət trendi"
                icon={<TrendingUp className="text-brand-orange" size={20} />}
              />
            </div>

            <div className="bg-brand-card p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-brand-border relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
                  <Globe size={200} className="text-brand-orange" />
               </div>
               <div className="relative z-10 max-w-2xl">
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-brand-text uppercase mb-4 tracking-tighter">Akademik İdarəetmə Sisteminə Xoş Gəlmisiniz</h3>
                  <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed mb-8">
                    Yuxarıdakı naviqasiya paneli vasitəsilə tələbə bazasını, müəllim heyətini və dərslərin gedişatını tam nəzarətdə saxlaya bilərsiniz. Hər bir bölmə üçün ətraflı statistik təhlillər və hesabatlar mövcuddur.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                     <button onClick={() => setActiveMainTab('students')} className="px-8 py-4 bg-brand-orange text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 shadow-xl shadow-brand-orange/20 transition-all text-center">Tələbələrə keç</button>
                     <button onClick={() => setActiveMainTab('groups')} className="px-8 py-4 bg-brand-surface border border-brand-border text-brand-text rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-card transition-all text-center">Qrupları idarə et</button>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 mb-2">
              <StatCard 
                label={`Ümumi ${activeMainTab === 'students' ? 'Tələbə' : activeMainTab === 'groups' ? 'Qrup' : 'Şəxslər'}`}
                value={activeMainTab === 'students' ? stats.total : activeMainTab === 'groups' ? groups.length : filteredUsers.length} 
                sub={activeMainTab === 'students' ? `${stats.active} Aktiv / ${stats.graduated} Məzun` : "Sistem üzrə ümumi"}
                icon={<UsersIcon className={accent.text} size={18} />}
              />
              <StatCard 
                label="Davamiyyət" 
                value={`${stats.attendance}%`} 
                sub="Həftəlik ortalama"
                icon={<TrendingUp className={accent.text} size={18} />}
              />
              <StatCard 
                label="Açıq Qeydlər" 
                value="14" 
                sub="Rəy gözləyən"
                icon={<Star className={accent.text} size={18} />}
              />
              <StatCard 
                label="Maliyyə Balansı" 
                value={`${stats.paymentSum} AZN`} 
                sub="Cari ay üzrə"
                icon={<Wallet className={accent.text} size={18} />}
              />
            </div>

            {/* Advanced Management Section */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-brand-card/50 backdrop-blur-md p-4 md:p-5 rounded-[28px] md:rounded-[36px] border border-brand-border">
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                    <input 
                      type="text" 
                      placeholder={`${activeMainTab === 'students' ? 'Tələbə' : activeMainTab === 'teachers' ? 'Müəllim' : 'Mentor'} axtar...`} 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-brand-surface/50 border border-brand-border rounded-2xl text-xs md:text-sm focus:outline-none focus:border-brand-orange/40 transition-all text-brand-text font-medium placeholder:text-gray-600"
                    />
                  </div>
                  {activeMainTab === 'students' && (
                    <select 
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="px-5 py-3 bg-brand-surface/50 border border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 focus:outline-none cursor-pointer hover:border-brand-orange/30 transition-all"
                    >
                      <option value="All">Bütün Statuslar</option>
                      {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
               </div>
               
               <div className="flex items-center justify-center gap-1.5 bg-brand-dark/40 p-1.5 rounded-2xl border border-brand-border">
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? `bg-brand-surface ${accent.text} shadow-lg shadow-black/20` : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <List size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? `bg-brand-surface ${accent.text} shadow-lg shadow-black/20` : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
               </div>
            </div>

            {/* Selected Actions Bar */}
            <AnimatePresence>
              {selectedIds.length > 0 && activeMainTab === 'students' && (
                <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="bg-brand-orange/10 border border-brand-orange/20 rounded-xl md:rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-orange text-brand-dark text-[9px] font-black px-2 py-0.5 rounded-full">{selectedIds.length}</span>
                    <span className="text-xs md:text-sm font-medium text-brand-orange/80">tələbə seçildi</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-brand-text px-4 py-2 bg-brand-surface border border-brand-border rounded-lg hover:border-brand-orange/50 transition-all">Qrupu Dəyiş</button>
                    <button className="flex-1 md:flex-none text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-brand-text px-4 py-2 bg-brand-surface border border-brand-border rounded-lg hover:border-brand-orange/50 transition-all">Statusu Güncəllə</button>
                    <button 
                      onClick={() => {
                        const data = filteredUsers.filter(u => selectedIds.includes(u.uid)).map(u => ({
                          'Ad Soyad': u.name,
                          'E-poçt': u.email,
                          'Status': u.status,
                          'Balans': u.balance + ' AZN'
                        }));
                        exportToExcel(data);
                      }}
                      className="flex-1 md:flex-none text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-brand-orange text-brand-dark px-4 py-2 rounded-lg hover:bg-opacity-90"
                    >
                      Excel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {activeMainTab === 'groups' ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                 {groups.map(group => (
                   <GroupCard 
                     key={group.id} 
                     group={group} 
                     onEdit={() => setEditingGroup(group)}
                     onDelete={() => handleDeleteGroup(group.id)}
                     teachers={users.filter(u => u.role === 'Teacher')}
                     mentors={users.filter(u => u.role === 'Mentor')}
                   />
                 ))}
               </div>
            ) : (
              viewMode === 'table' ? (
                <div className="bg-brand-card/30 backdrop-blur-sm rounded-[32px] border border-brand-border overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-brand-border">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="text-[10px] text-gray-500 border-b border-brand-border uppercase tracking-widest bg-brand-surface/50">
                          {activeMainTab === 'students' && (
                            <th className="px-8 py-5 w-16">
                              <input 
                                type="checkbox" 
                                checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded-lg border-brand-border bg-brand-dark/50 text-brand-orange focus:ring-0 cursor-pointer transition-all"
                              />
                            </th>
                          )}
                          <th className="px-8 py-5 font-black">{activeMainTab === 'students' ? 'Tələbə Şəxs' : activeMainTab === 'teachers' ? 'Müəllim Heyəti' : 'Mentor Heyəti'}</th>
                          {activeMainTab === 'students' ? (
                            <>
                              <th className="px-8 py-5 font-black">Identifikasiya</th>
                              <th className="px-8 py-5 font-black">Xüsusi İxtisas</th>
                              <th className="px-8 py-5 font-black">Cari Status</th>
                              <th className="px-8 py-5 font-black">Davam</th>
                            </>
                          ) : (
                            <th className="px-8 py-5 font-black">Təhkim Olunan Qruplar</th>
                          )}
                          <th className="px-8 py-5 font-black">Maliyyə Balansı</th>
                          <th className="px-8 py-5 font-black text-right">İdarəetmə</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-brand-border">
                        {filteredUsers.map((u, idx) => (
                          <motion.tr 
                            key={u.uid}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="hover:bg-brand-surface/40 transition-all group"
                          >
                               {activeMainTab === 'students' && (
                                 <td className="px-8 py-5">
                                   <input 
                                     type="checkbox" 
                                     checked={selectedIds.includes(u.uid)}
                                     onChange={() => toggleSelect(u.uid)}
                                     className="w-4 h-4 rounded-lg border-brand-border bg-brand-dark/50 text-brand-orange focus:ring-0 cursor-pointer transition-all"
                                   />
                                 </td>
                               )}
                               <td className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-11 h-11 rounded-2xl ${accent.bgLight} border ${accent.borderLight} flex items-center justify-center font-black ${accent.text} text-sm group-hover:scale-105 transition-transform`}>
                                        {u.name.charAt(0)}
                                     </div>
                                     <div className="min-w-0">
                                        <p className="font-bold text-brand-text truncate text-sm">{u.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate font-medium">{u.email}</p>
                                     </div>
                                  </div>
                               </td>
                               {activeMainTab === 'students' ? (
                                 <>
                                   <td className="px-8 py-5">
                                      <p className={`font-mono text-[10px] ${accent.text} font-black mb-0.5 tracking-tighter`}>{u.fin}</p>
                                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">{u.university}</p>
                                   </td>
                                   <td className="px-8 py-5">
                                      <p className="text-[11px] text-brand-text font-black uppercase tracking-tight opacity-80">{u.specialty}</p>
                                   </td>
                                   <td className="px-8 py-5"><StatusBadge status={u.status} /></td>
                                   <td className="px-8 py-5">
                                      <span className="text-[11px] font-black font-mono text-brand-text bg-brand-surface px-2 py-1 rounded-lg border border-brand-border">{u.attendance || 0}%</span>
                                   </td>
                                 </>
                               ) : (
                                 <td className="px-8 py-5">
                                    <div className="flex flex-wrap gap-1.5">
                                      {groups.filter(g => g.teacherId === u.uid || g.mentorId === u.uid).map(g => (
                                        <span key={g.id} className="px-2 py-0.5 bg-brand-surface border border-brand-border rounded-md text-[9px] font-black text-brand-text uppercase">{g.name}</span>
                                      ))}
                                    </div>
                                 </td>
                               )}
                               <td className="px-8 py-5 font-mono text-xs text-brand-text font-bold whitespace-nowrap">
                                  <span className={u.balance < 0 ? 'text-red-400' : 'text-green-400'}>{u.balance} AZN</span>
                               </td>
                               <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                  <button onClick={() => setEditingUser(u)} className="p-2.5 hover:bg-brand-surface rounded-xl text-gray-500 hover:text-brand-text transition-all group-hover:bg-brand-orange group-hover:text-brand-dark"><Edit2 size={14} /></button>
                                  <button onClick={() => handleDeleteUser(u.uid)} className="p-2.5 hover:bg-red-500/10 rounded-xl text-gray-500 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                               </td>
                            </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 md:space-y-12">
                   {activeMainTab === 'students' ? (
                     <>
                       {groups.map(group => {
                          const groupStudents = users.filter(u => u.groupId === group.id);
                          if (groupStudents.length === 0) return null;
                          return (
                            <div key={group.id} className="space-y-4">
                               <div className="flex items-center gap-3">
                                  <h3 className="text-sm md:text-lg font-black text-brand-text uppercase tracking-widest">{group.name}</h3>
                                  <div className="h-px flex-1 bg-brand-border"></div>
                                  <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase">{groupStudents.length} Tələbə</span>
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
                                  {groupStudents.map((student, sIdx) => (
                                    <motion.div 
                                      key={student.uid}
                                      initial={{ opacity: 0, y: 15 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: sIdx * 0.05 }}
                                      className={`bg-brand-card/40 backdrop-blur-sm p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-brand-border hover:${accent.border} transition-all group relative overflow-hidden`}
                                    >
                                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                          <Target size={60} />
                                       </div>
                                       <div className="flex justify-between items-start mb-6 relative z-10">
                                          <div className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl ${accent.bgLight} border ${accent.borderLight} flex items-center justify-center font-black ${accent.text} text-sm md:text-base group-hover:${accent.bg} group-hover:text-brand-dark transition-all duration-500`}>
                                            {student.name.charAt(0)}
                                          </div>
                                          <StatusBadge status={student.status} />
                                       </div>
                                       <h4 className="font-bold text-sm md:text-base text-brand-text mb-1 relative z-10 group-hover:text-brand-orange transition-colors">{student.name}</h4>
                                       <p className="text-[10px] text-gray-500 mb-6 truncate font-medium relative z-10">{student.email}</p>
                                       <div className="pt-4 border-t border-brand-border/50 flex justify-between items-center relative z-10">
                                          <div className="text-center bg-brand-surface/30 px-3 py-1.5 rounded-xl border border-brand-border/30">
                                             <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Bal</p>
                                             <p className={`text-xs font-black font-mono ${accent.text}`}>{student.avgScore || 0}</p>
                                          </div>
                                          <div className="text-center bg-brand-surface/30 px-3 py-1.5 rounded-xl border border-brand-border/30">
                                             <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Qayıb</p>
                                             <p className="text-xs font-black font-mono text-red-500/80">{100 - (student.attendance || 0)}%</p>
                                          </div>
                                       </div>
                                    </motion.div>
                                  ))}
                               </div>
                            </div>
                          );
                       })}
                       {/* Non-grouped individuals */}
                       {users.filter(u => u.role === Role.Student && !u.groupId).length > 0 && (
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                               <h3 className="text-sm md:text-lg font-black text-gray-500 uppercase tracking-widest italic">Qrupda olmayanlar</h3>
                               <div className="h-px flex-1 bg-brand-border opacity-30"></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                               {users.filter(u => u.role === Role.Student && !u.groupId).map(student => (
                                 <div key={student.uid} className="bg-brand-card p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-brand-border opacity-60">
                                    <h4 className="font-bold text-sm md:text-base text-brand-text mb-1">{student.name}</h4>
                                    <p className="text-[9px] md:text-[10px] text-gray-500 truncate">{student.email}</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                     </>
                   ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                       {filteredUsers.map(u => {
                          const taughtGroups = groups.filter(g => g.teacherId === u.uid || g.mentorId === u.uid);
                          return (
                            <motion.div 
                              key={u.uid}
                              whileHover={{ scale: 1.02 }}
                              className={`bg-brand-card p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-brand-border hover:${accent.border}/30 active:scale-95 transition-all`}
                            >
                               <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl ${accent.bgLight} flex items-center justify-center text-xl md:text-2xl font-black ${accent.text} mb-4 md:mb-6`}>
                                  {u.name.charAt(0)}
                               </div>
                               <h4 className="text-lg md:text-xl font-bold text-brand-text mb-1">{u.name}</h4>
                               <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">{u.email}</p>
                               <div className="space-y-2">
                                 <p className="text-[8px] md:text-[9px] font-black text-gray-600 uppercase tracking-widest">Tədris Elədiyi Qruplar</p>
                                 <div className="flex flex-wrap gap-2">
                                   {taughtGroups.length > 0 ? taughtGroups.map(g => (
                                     <span key={g.id} className={`px-2 py-1 bg-[#1E1E21] border border-[#2C2C30] rounded-lg text-[8px] md:text-[10px] font-black ${accent.text}`}>{g.name}</span>
                                   )) : <span className="text-[8px] md:text-[10px] text-gray-600 italic">Yoxdur</span>}
                                 </div>
                               </div>
                            </motion.div>
                          );
                       })}
                     </div>
                   )}
                </div>
              )
            )}
          </div>
        )}
      <AnimatePresence>
        {editingGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-brand-card border border-brand-border p-8 rounded-[32px] w-full max-w-lg shadow-2xl relative"
            >
               <button onClick={() => setEditingGroup(null)} className="absolute top-8 right-8 text-gray-400 hover:text-brand-orange">
                  <X size={24} />
               </button>
               <h3 className="text-2xl font-black text-brand-text uppercase mb-2">Qrup İdarəetməsi</h3>
               <p className="text-gray-500 mb-8 font-medium italic">{editingGroup.name}</p>
               
               <form className="space-y-6" onSubmit={(e) => {
                 e.preventDefault();
                 const formData = new FormData(e.target);
                 handleUpdateGroup(editingGroup.id, {
                   teacherId: formData.get('teacherId'),
                   mentorId: formData.get('mentorId'),
                   name: formData.get('name'),
                   lessonHours: formData.get('lessonHours'),
                   syllabusUrl: formData.get('syllabusUrl')
                 });
               }}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Qrup Adı</label>
                    <input 
                      name="name"
                      defaultValue={editingGroup.name}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none text-brand-text"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dərs Saatları</label>
                      <input 
                        name="lessonHours"
                        placeholder="məs: 19:00 - 21:00"
                        defaultValue={editingGroup.lessonHours}
                        className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none text-brand-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sillabus Linki</label>
                      <input 
                        name="syllabusUrl"
                        placeholder="PDF/Drive Link"
                        defaultValue={editingGroup.syllabusUrl}
                        className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none text-brand-text"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trainer (Teacher)</label>
                    <select 
                      name="teacherId"
                      defaultValue={editingGroup.teacherId}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none text-brand-text"
                    >
                      <option value="">Seçilməyib</option>
                      {users.filter(u => u.role === 'Teacher').map(t => (
                        <option key={t.uid} value={t.uid}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mentor</label>
                    <select 
                      name="mentorId"
                      defaultValue={editingGroup.mentorId}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none text-brand-text"
                    >
                      <option value="">Seçilməyib</option>
                      {users.filter(u => u.role === 'Mentor').map(m => (
                        <option key={m.uid} value={m.uid}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-brand-orange text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 shadow-lg shadow-brand-orange/20 mt-4 transition-all"
                  >
                    Dəyişiklikləri Yadda Saxla
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddModal 
        type={activeMainTab}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={async (data) => {
          const role = activeMainTab === 'students' ? Role.Student : 
                       activeMainTab === 'teachers' ? Role.Teacher : 
                       activeMainTab === 'mentors' ? Role.Mentor : null;
          
          let response;
          if (activeMainTab === 'groups') {
              response = await fetch('/api/admin/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, students: [] })
              });
          } else {
              response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, role })
              });
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'Server xətası baş verdi.');
          }

          fetchData();
        }}
        teachers={users.filter(u => u.role === Role.Teacher)}
        mentors={users.filter(u => u.role === Role.Mentor)}
      />

      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onUpdate={handleUpdateUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
}
