import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, FileSpreadsheet, Edit2, Trash2, Shield, User, Briefcase, Zap, X, Save, Key } from 'lucide-react';
import { ExcelService } from '../services/excelService';
import { AuthService } from '../services/authService';
import { Role } from '../constants';
import StatusBadge from './common/StatusBadge';

import ConfirmModal from './common/ConfirmModal';

export default function AccountsManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, uid: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataToExport = filteredUsers.map(u => ({
      'Ad Soyad': u.name,
      'Email': u.email,
      'Rol': u.role,
      'FIN': u.fin || 'N/A',
      'Telefon': u.phone || 'N/A',
      'Status': u.status || 'Aktiv',
      'Son Giriş': u.lastLogin ? new Date(u.lastLogin).toLocaleString('az-AZ') : 'Giriş edilməyib'
    }));
    ExcelService.exportData(dataToExport, 'LMS_Hesablar_Hesabat');
  };

  const initiateDelete = (uid) => {
    setConfirmModal({ isOpen: true, uid });
  };

  const executeDelete = async () => {
    const { uid } = confirmModal;
    setConfirmModal({ isOpen: false, uid: null });
    try {
      const currentUser = AuthService.getCurrentUser();
      const res = await fetch(`/api/admin/users/${uid}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: currentUser?.name || 'Admin' })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Silinmədi');
      }
      fetchUsers();
    } catch (error) {
       console.error('Delete error:', error);
       alert(error.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/users/${editingUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Yenilənmədi');
      }
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Update error:', error);
      alert(error.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                         u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case Role.Admin: return <Shield className="text-red-500" size={16} />;
      case Role.Teacher: return <Briefcase className="text-emerald-500" size={16} />;
      case Role.Mentor: return <Zap className="text-indigo-500" size={16} />;
      default: return <User className="text-gray-400" size={16} />;
    }
  };

  const inputClass = "w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none text-brand-text placeholder:text-gray-600 transition-all";
  const labelClass = "text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1";

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-brand-text uppercase tracking-tighter">Hesabların İdarəedilməsi</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Sistem istifadəçiləri və giriş məlumatları</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2.5 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
          >
            <FileSpreadsheet size={16} />
            Eksport (Excel)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-brand-card p-6 rounded-[32px] border border-brand-border flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Ad və ya Email ilə axtar..."
            className="w-full bg-brand-surface border border-brand-border rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-brand-orange outline-none text-brand-text placeholder:text-gray-600 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {['All', Role.Admin, Role.Teacher, Role.Mentor, Role.Student].map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center ${
                filterRole === role 
                  ? 'bg-brand-orange text-brand-dark shadow-lg shadow-brand-orange/20' 
                  : 'bg-brand-surface text-gray-500 hover:text-brand-text border border-brand-border'
              }`}
            >
              {role === 'All' ? 'Hamısı' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-brand-card rounded-[32px] border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-brand-surface/50 border-b border-brand-border">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">İstifadəçi</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Rol & Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Əlaqə</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Son Aktivlik</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filteredUsers.map(u => (
                <tr key={u.uid} className="hover:bg-brand-surface/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/5 border border-brand-orange/10 flex items-center justify-center text-brand-orange font-black">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-text">{u.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono tracking-tight">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {getRoleIcon(u.role)}
                        <span className="text-[10px] font-black uppercase text-gray-400">{u.role}</span>
                      </div>
                      <StatusBadge status={u.status || 'Active'} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-bold text-brand-text">{u.phone || 'Yoxdur'}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-black mt-0.5">FIN: {u.fin || '------'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-bold text-gray-400">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString('az-AZ') : 'Giriş edilməyib'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUser(u);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-gray-500 hover:text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          initiateDelete(u.uid);
                        }}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-brand-card border border-brand-border p-8 rounded-[32px] w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="absolute top-8 right-8 text-gray-400 hover:text-brand-orange transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-surface rounded-2xl border border-brand-border">
                  <Key className="text-brand-orange" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-brand-text uppercase leading-none">Hesabı Redaktə Et</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">İstifadəçi məlumatlarını yenilə</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1">
                  <label className={labelClass}>Ad Soyad</label>
                  <input 
                    className={inputClass}
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Email</label>
                    <input 
                      className={inputClass}
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Telefon</label>
                    <input 
                      className={inputClass}
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>FIN Kodu</label>
                    <input 
                      className={inputClass}
                      value={editingUser.fin}
                      maxLength={7}
                      onChange={(e) => setEditingUser({ ...editingUser, fin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Rol</label>
                    <select 
                      className={inputClass}
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    >
                      {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Yeni Şifrə (Dəyişmək istəmirsinizsə boş qoyun)</label>
                  <input 
                    type="password"
                    className={inputClass}
                    placeholder="••••••••"
                    onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-brand-orange text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-orange/20 mt-4 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  <span>Dəyişiklikləri Yadda Saxla</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onCancel={() => setConfirmModal({ isOpen: false, uid: null })}
        onConfirm={executeDelete}
      />
    </div>
  );
}
