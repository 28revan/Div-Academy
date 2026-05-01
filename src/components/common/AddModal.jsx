import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Briefcase, Zap, BookOpen, Save } from 'lucide-react';
import { Role, StudentStatus } from '../../constants';

export default function AddModal({ type, isOpen, onClose, onAdd, teachers, mentors }) {
  const [formData, setFormData] = useState({});

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'students': return 'Yeni Tələbə';
      case 'teachers': return 'Yeni Müəllim';
      case 'mentors': return 'Yeni Mentor';
      case 'groups': return 'Yeni Qrup';
      default: return 'Əlavə Et';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'students': return <UserPlus className="text-brand-orange" size={20} />;
      case 'teachers': return <Briefcase className="text-emerald-500" size={20} />;
      case 'mentors': return <Zap className="text-indigo-500" size={20} />;
      case 'groups': return <BookOpen className="text-amber-500" size={20} />;
      default: return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onAdd(formData);
      onClose();
      setFormData({});
    } catch (err) {
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
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
              {getIcon()}
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
            {type !== 'groups' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Ad Soyad</label>
                    <input name="name" required placeholder="məs: Əli Vəliyev" className={inputClass} onChange={handleChange} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>FIN Kodu</label>
                    <input name="fin" required placeholder="7 simvol" maxLength={7} className={inputClass} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Email</label>
                  <input name="email" type="email" required placeholder="email@div.edu.az" className={inputClass} onChange={handleChange} />
                </div>
                {type === 'students' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelClass}>Status</label>
                      <select name="status" className={inputClass} onChange={handleChange}>
                        {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Telefon</label>
                      <input name="phone" placeholder="+994" className={inputClass} onChange={handleChange} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className={labelClass}>Qrup Adı</label>
                  <input name="name" required placeholder="məs: FSD-23-1" className={inputClass} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Dərs Saatları</label>
                    <input name="hours" placeholder="19:00 - 21:00" className={inputClass} onChange={handleChange} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Başlama Tarixi</label>
                    <input name="startDate" type="date" className={inputClass} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Trainer (Müəllim)</label>
                    <select name="teacherId" className={inputClass} onChange={handleChange}>
                      <option value="">Seçilməyib</option>
                      {teachers?.map(t => <option key={t.uid} value={t.uid}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Mentor</label>
                    <select name="mentorId" className={inputClass} onChange={handleChange}>
                      <option value="">Seçilməyib</option>
                      {mentors?.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-brand-orange text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-orange/20 mt-4 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>Yadda Saxla</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
