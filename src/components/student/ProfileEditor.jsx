import React, { useState } from 'react';
import { Save, X, Plus } from 'lucide-react';

function SkillInput({ label, value, onChange, placeholder, colorClass }) {
  const [inputValue, setInputValue] = useState('');
  const skills = value ? value.split(',').filter(s => s.trim() !== '') : [];

  const handleAdd = () => {
    if (inputValue.trim()) {
      const newSkills = [...skills, inputValue.trim()].join(',');
      onChange(newSkills);
      setInputValue('');
    }
  };

  const handleRemove = (index) => {
    const newSkills = skills.filter((_, i) => i !== index).join(',');
    onChange(newSkills);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="bg-brand-surface border border-brand-border rounded-xl p-2 min-h-[50px] focus-within:border-brand-orange transition-all">
        <div className="flex flex-wrap gap-2 mb-2">
          {skills.map((skill, i) => (
            <span key={i} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${colorClass || 'bg-brand-orange'}`}>
              {skill}
              <button type="button" onClick={() => handleRemove(i)} className="hover:text-red-300 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm outline-none px-2 py-1"
          />
          <button 
            type="button" 
            onClick={handleAdd}
            className="p-1.5 bg-brand-orange/10 text-brand-orange rounded-lg hover:bg-brand-orange hover:text-white transition-all"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileEditor({ user, onSave, onCancel }) {
  const [form, setForm] = useState(user);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Normalize links
    const normalizeLink = (link) => {
      if (!link) return link;
      if (!link.includes('://')) {
        return `https://${link}`;
      }
      return link;
    };

    const finalForm = {
      ...form,
      linkedinLink: normalizeLink(form.linkedinLink),
      githubLink: normalizeLink(form.githubLink)
    };

    onSave(finalForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-brand-card border border-brand-border p-5 md:p-8 rounded-[24px] md:rounded-[32px] w-full max-w-2xl shadow-2xl relative max-h-[95vh] overflow-y-auto no-scrollbar">
        <button onClick={onCancel} className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-500 hover:text-brand-orange">
          <X size={24} />
        </button>
        <h3 className="text-xl md:text-2xl font-black text-brand-text uppercase mb-6 md:mb-8 text-center md:text-left">Profili Redaktə Et</h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tam Ad</label>
            <input 
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
            <input 
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ata Adı</label>
            <input 
              name="patronymic"
              value={form.patronymic}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Təvəllüd</label>
            <input 
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Universitet</label>
            <input 
              name="university"
              value={form.university}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">İxtisas</label>
            <input 
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
            />
          </div>

          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkillInput 
              label="Yumşaq Bacarıqlar (Soft Skills)"
              value={form.softSkills || ''}
              onChange={(val) => handleSkillsChange('softSkills', val)}
              placeholder="Yazın və Enter basın..."
              colorClass="bg-gray-600"
            />
            <SkillInput 
              label="Kompüter Biliyi"
              value={form.computerSkills || ''}
              onChange={(val) => handleSkillsChange('computerSkills', val)}
              placeholder="Yazın və Enter basın..."
              colorClass="bg-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">GitHub Linki</label>
            <input 
              name="githubLink"
              type="text"
              value={form.githubLink || ''}
              onChange={handleChange}
              placeholder="github.com/..."
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">LinkedIn Linki</label>
            <input 
              name="linkedinLink"
              type="text"
              value={form.linkedinLink || ''}
              onChange={handleChange}
              placeholder="linkedin.com/in/..."
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Telefon</label>
            <div className="flex gap-2">
              <select 
                className="bg-brand-surface border border-brand-border rounded-xl px-2 py-3 text-xs outline-none focus:border-brand-orange"
                onChange={(e) => {
                  const code = e.target.value;
                  if (!form.phone?.startsWith(code)) {
                    setForm(prev => ({ ...prev, phone: code + (prev.phone?.replace(/^\+\d+/, '') || '') }));
                  }
                }}
              >
                <option value="+994">AZ +994</option>
                <option value="+90">TR +90</option>
                <option value="+7">RU +7</option>
                <option value="+1">US +1</option>
                <option value="+44">UK +44</option>
                <option value="+49">DE +49</option>
                <option value="+33">FR +33</option>
                <option value="+971">UAE +971</option>
                <option value="+380">UA +380</option>
                <option value="+995">GE +995</option>
              </select>
              <input 
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                placeholder="Nömrəniz"
                className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Təqaüd (Dəyişdirilə bilməz)</label>
            <input 
              disabled
              value={form.scholarship}
              className="w-full bg-brand-surface/50 border border-brand-border rounded-xl px-4 py-3 text-sm outline-none text-gray-500 cursor-not-allowed"
            />
          </div>
          
          <button type="submit" className="col-span-full py-4 bg-brand-orange text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 shadow-xl shadow-brand-orange/20 mt-4 transition-all flex items-center justify-center gap-2">
            <Save size={16} /> Yadda Saxla
          </button>
        </form>
      </div>
    </div>
  );
}
