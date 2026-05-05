import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Briefcase, Zap, Save, Trash2 } from 'lucide-react';
import { Role, StudentStatus } from '../../constants';

export default function EditUserModal({ user, isOpen, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const getTitle = () => {
    switch (user.role) {
      case Role.Student: return 'Tələbəni Redaktə Et';
      case Role.Teacher: return 'Müəllimi Redaktə Et';
      case Role.Mentor: return 'Mentoru Redaktə Et';
      default: return 'İstifadəçini Redaktə Et';
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onUpdate(user.uid, formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    onDelete(user.uid);
    onClose();
  };

  const inputClass = "w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none text-brand-text placeholder:text-gray-600 transition-all";
  const labelClass = "text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-brand-card border border-brand-border p-5 md:p-8 rounded-[24px] md:rounded-[32px] w-full max-w-lg shadow-2xl relative max-h-[95vh] overflow-y-auto no-scrollbar"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-brand-orange transition-colors">
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 md:p-3 bg-brand-surface rounded-2xl border border-brand-border">
              <User className="text-brand-orange" size={20} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-brand-text uppercase leading-none">{getTitle()}</h3>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Div Academy LMS</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Ad Soyad</label>
                <input name="name" value={formData.name || ''} required placeholder="məs: Əli Vəliyev" className={inputClass} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>FIN Kodu</label>
                <input name="fin" value={formData.fin || ''} required placeholder="7 simvol" maxLength={7} className={inputClass} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Email</label>
              <input name="email" value={formData.email || ''} type="email" required placeholder="email@div.edu.az" className={inputClass} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Yeni Şifrə (Dəyişmək üçün)</label>
              <input name="newPassword" type="password" placeholder="Yeni şifrə yazın (opsional)" className={inputClass} onChange={handleChange} />
            </div>
            {user.role === Role.Student && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Status</label>
                  <select name="status" value={formData.status || ''} className={inputClass} onChange={handleChange}>
                    {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Mobil Telefon</label>
                  <input name="phone" value={formData.phone || ''} placeholder="+99450..." className={inputClass} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Maliyyə Balansı</label>
                  <input name="balance" type="number" value={formData.balance || 0} placeholder="-500" className={inputClass} onChange={handleChange} />
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-4 bg-red-500/10 text-red-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                <span>Sil</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-brand-orange text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                <span>Yenilə</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
