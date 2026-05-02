import React, { useState } from 'react';
import { Download, Plus, Trash2, FileText, User, Briefcase, GraduationCap } from 'lucide-react';
import { saveAs } from 'file-saver';

export default function CVGenerator({ user, projects }) {
  const [cvData, setCvData] = useState({
    summary: '',
    experience: [{ company: '', position: '', period: '', desc: '' }],
    education: user ? [{ 
      school: user.university || '', 
      degree: user.specialty || '', 
      year: '' 
    }] : [{ school: '', degree: '', year: '' }],
    certificates: [{ name: '', organization: '', year: '' }]
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Auto-fill from user profile when component mounts or user changes
  React.useEffect(() => {
    if (user) {
      setCvData(prev => ({
        ...prev,
        summary: prev.summary === '' ? `${user.specialty || 'Mütəxəssis'} sahəsində fəaliyyət göstərən, ${user.university || 'Universitet'} məzunu/tələbəsi. ${user.computerSkills || ''} biliklərinə sahibəm və texniki bacarıqlarımı real layihələrdə tətbiq etmək əzmindəyəm. ${user.softSkills ? 'Komandada işləmə və ' + user.softSkills + ' bacarıqlarına malikəm.' : ''}` : prev.summary,
        education: prev.education[0].school === '' && prev.education[0].degree === '' 
          ? [{ school: user.university || '', degree: user.specialty || '', year: user.dob ? user.dob.split('-')[0] : '' }] 
          : prev.education
      }));
    }
  }, [user]);

  const handleAddField = (section) => {
    const defaultValues = {
      experience: { company: '', position: '', period: '', desc: '' },
      education: { school: '', degree: '', year: '' },
      certificates: { name: '', organization: '', year: '' }
    };
    setCvData({
      ...cvData,
      [section]: [...cvData[section], defaultValues[section]]
    });
  };

  const handleRemoveField = (section, index) => {
    const list = [...cvData[section]];
    list.splice(index, 1);
    setCvData({ ...cvData, [section]: list });
  };

  const handleFieldChange = (section, index, field, value) => {
    const list = [...cvData[section]];
    list[index][field] = value;
    setCvData({ ...cvData, [section]: list });
  };

  const exportWord = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(30);

    try {
      // Step 1: Send request to server
      const response = await fetch('/api/student/cv/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvData, user, projects }),
      });

      setExportProgress(70);

      if (!response.ok) {
        throw new Error('Serverdə xəta baş verdi');
      }

      // Step 2: Receive blob
      const blob = await response.blob();
      setExportProgress(100);
      
      setTimeout(() => {
        saveAs(blob, `${(user?.name || 'Tələbə').replace(/ /g, '_')}_CV.docx`);
        setIsExporting(false);
        setExportProgress(0);
      }, 500);

    } catch (err) {
      console.error('Word generation failed:', err);
      alert('Sənəd hazırlanarkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Editor Side */}
        <div className="space-y-8 bg-brand-surface p-8 rounded-3xl border border-brand-border">
          <div className="flex items-center gap-3 border-b border-brand-border pb-4">
             <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
                <FileText size={20} />
             </div>
             <h3 className="text-xl font-black text-brand-text uppercase italic">ATS CV Hazırla</h3>
          </div>

          <div className="space-y-6">
            {/* Professional Summary */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-brand-orange" /> Haqqında
              </label>
              <textarea 
                value={cvData.summary}
                onChange={e => setCvData({...cvData, summary: e.target.value})}
                placeholder="Özünüz haqqında qısa xülasə..."
                className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none h-32 resize-none"
              />
            </div>

            {/* Work Experience */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-brand-surface/50 p-3 rounded-xl border border-brand-border">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <Briefcase size={14} className="text-brand-orange" /> İş Təcrübəsi
                 </label>
                 <button onClick={() => handleAddField('experience')} className="px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-lg hover:bg-brand-orange hover:text-brand-dark transition-all text-[9px] font-black uppercase flex items-center gap-1">
                    <Plus size={12} /> Əlavə et
                 </button>
              </div>
              <div className="space-y-4">
                {cvData.experience.map((exp, i) => (
                  <div key={i} className="p-4 bg-brand-card border border-brand-border rounded-2xl relative space-y-3">
                    <button onClick={() => handleRemoveField('experience', i)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400">
                       <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                       <input 
                         placeholder="Şirkət"
                         value={exp.company}
                         onChange={e => handleFieldChange('experience', i, 'company', e.target.value)}
                         className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange"
                       />
                       <input 
                         placeholder="Vəzifə"
                         value={exp.position}
                         onChange={e => handleFieldChange('experience', i, 'position', e.target.value)}
                         className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange"
                       />
                    </div>
                    <input 
                      placeholder="Müddət (məs: 2021 - Hazırda)"
                      value={exp.period}
                      onChange={e => handleFieldChange('experience', i, 'period', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange"
                    />
                    <textarea 
                      placeholder="Tapşırıqlar və nailiyyətlər..."
                      value={exp.desc}
                      onChange={e => handleFieldChange('experience', i, 'desc', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange h-20 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-brand-surface/50 p-3 rounded-xl border border-brand-border">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <GraduationCap size={14} className="text-brand-orange" /> Təhsil
                  </label>
                  <button onClick={() => handleAddField('education')} className="px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-lg hover:bg-brand-orange hover:text-brand-dark transition-all text-[9px] font-black uppercase flex items-center gap-1">
                     <Plus size={12} /> Əlavə et
                  </button>
               </div>
               <div className="space-y-4">
                 {cvData.education.map((edu, i) => (
                   <div key={i} className="p-4 bg-brand-card border border-brand-border rounded-2xl relative space-y-3">
                     <button onClick={() => handleRemoveField('education', i)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400">
                        <Trash2 size={16} />
                     </button>
                     <input 
                       placeholder="Müəssisə"
                       value={edu.school}
                       onChange={e => handleFieldChange('education', i, 'school', e.target.value)}
                       className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange"
                     />
                     <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="Dərəcə"
                          value={edu.degree}
                          onChange={e => handleFieldChange('education', i, 'degree', e.target.value)}
                          className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange"
                        />
                        <input 
                          placeholder="İl"
                          value={edu.year}
                          onChange={e => handleFieldChange('education', i, 'year', e.target.value)}
                          className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange"
                        />
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Certificates */}
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-brand-surface/50 p-3 rounded-xl border border-brand-border">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-brand-orange" /> Sertifikatlar
                  </label>
                  <button onClick={() => handleAddField('certificates')} className="px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-lg hover:bg-brand-orange hover:text-brand-dark transition-all text-[9px] font-black uppercase flex items-center gap-1">
                     <Plus size={12} /> Əlavə et
                  </button>
               </div>
               <div className="space-y-4">
                 {cvData.certificates.map((cert, i) => (
                   <div key={i} className="p-4 bg-brand-card border border-brand-border rounded-2xl relative space-y-3">
                     <button onClick={() => handleRemoveField('certificates', i)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400">
                        <Trash2 size={16} />
                     </button>
                     <input 
                       placeholder="Sertifikatın adı"
                       value={cert.name}
                       onChange={e => handleFieldChange('certificates', i, 'name', e.target.value)}
                       className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange"
                     />
                     <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="Təşkilat"
                          value={cert.organization}
                          onChange={e => handleFieldChange('certificates', i, 'organization', e.target.value)}
                          className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange"
                        />
                        <input 
                          placeholder="İl"
                          value={cert.year}
                          onChange={e => handleFieldChange('certificates', i, 'year', e.target.value)}
                          className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-orange"
                        />
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="space-y-4">
            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-brand-orange uppercase tracking-widest">
                  <span>Hazırlanır...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-brand-card border border-brand-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-orange transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button 
              onClick={exportWord}
              disabled={isExporting}
              className={`w-full py-4 bg-brand-orange text-brand-dark rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-brand-orange/20 transition-all ${isExporting ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
               <Download size={18} /> {isExporting ? 'Yüklənir...' : 'WORD olaraq yüklə'}
            </button>
          </div>
        </div>


        {/* Preview Side (A4 Style) */}
        <div className="hidden xl:block">
           <div className="sticky top-10 flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">ATS Preview (Modern)</span>
              <div 
                className="w-[210mm] min-h-[297mm] bg-white p-16 text-gray-900 shadow-2xl origin-top"
                style={{ transform: 'scale(0.6)' }}
              >
                 {/* Modern Left-Aligned Header */}
                 <div className="mb-10 text-left">
                    <h1 className="text-4xl font-black uppercase text-gray-900 tracking-tight leading-none mb-3">{user.name}</h1>
                    <p className="text-xl font-bold text-brand-orange mb-4 italic uppercase tracking-wide">{user.specialty || 'Mütəxəssis'}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-500 border-t border-gray-100 pt-3">
                       <span className="flex items-center gap-1">{user.email}</span>
                       <span className="text-gray-300">•</span>
                       <span>{user.phone || ''}</span>
                       {user.linkedinLink && (
                         <>
                           <span className="text-gray-300">•</span>
                           <span>{user.linkedinLink?.replace(/^https?:\/\//, '').replace(/^www\./, '')}</span>
                         </>
                       )}
                    </div>
                 </div>

                 <div className="space-y-10">
                    {/* Summary / Profile */}
                    {cvData.summary && (
                      <div className="space-y-3">
                         <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange border-b-2 border-brand-orange pb-1 inline-block">Profile</h2>
                         <p className="text-xs leading-relaxed text-gray-600 font-medium text-justify">{cvData.summary}</p>
                      </div>
                    )}

                    {/* Experience section */}
                    <div className="space-y-5">
                       <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange border-b-2 border-brand-orange pb-1 inline-block">Experience</h2>
                       <div className="space-y-6">
                         {cvData.experience.map((exp, i) => (
                           <div key={i} className="space-y-1">
                              <div className="flex justify-between items-baseline">
                                 <h3 className="text-[13px] font-black text-gray-900">{exp.position}</h3>
                                 <span className="text-[10px] font-bold text-brand-orange">{exp.period}</span>
                              </div>
                              <p className="text-[11px] font-bold text-gray-500 italic">{exp.company}</p>
                              <p className="text-[11px] leading-relaxed text-gray-600 font-medium mt-1">{exp.desc}</p>
                           </div>
                         ))}
                       </div>
                    </div>

                    {/* Education section */}
                    <div className="space-y-5">
                       <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange border-b-2 border-brand-orange pb-1 inline-block">Education</h2>
                       <div className="space-y-4">
                         {cvData.education.map((edu, i) => (
                            <div key={i} className="space-y-1">
                               <div className="flex justify-between items-baseline">
                                  <h3 className="text-[12px] font-black">{edu.school}</h3>
                                  <span className="text-[10px] font-bold text-gray-400">{edu.year}</span>
                               </div>
                               <p className="text-[11px] text-gray-500 font-bold italic">{edu.degree}</p>
                            </div>
                         ))}
                       </div>
                    </div>

                    {/* Projects section */}
                    {projects && projects.length > 0 && (
                       <div className="space-y-5">
                          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange border-b-2 border-brand-orange pb-1 inline-block">Relevant Projects</h2>
                          <div className="space-y-6">
                            {projects.map((proj, i) => (
                               <div key={i} className="space-y-1">
                                  <div className="flex justify-between items-baseline">
                                     <h3 className="text-[13px] font-black text-gray-900">{proj.title}</h3>
                                     <span className="text-[10px] font-bold text-brand-orange">{proj.tech}</span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-gray-600 font-medium mt-1">{proj.description}</p>
                               </div>
                            ))}
                          </div>
                       </div>
                    )}

                    {/* Skills & Others */}
                    <div className="grid grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange border-b-2 border-brand-orange pb-1 inline-block">Skills</h2>
                          <div className="space-y-4">
                             <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Soft Skills</p>
                                <div className="flex flex-wrap gap-1">
                                   {user.softSkills?.split(',').map((s, i) => (
                                      <span key={i} className="text-[9px] bg-gray-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">{s.trim()}</span>
                                   ))}
                                </div>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Technical</p>
                                <div className="flex flex-wrap gap-1">
                                   {user.computerSkills?.split(',').map((s, i) => (
                                      <span key={i} className="text-[9px] bg-brand-orange text-white px-2 py-0.5 rounded-full font-bold shadow-sm">{s.trim()}</span>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>

                       {cvData.certificates.some(c => c.name) && (
                          <div className="space-y-4">
                             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange border-b-2 border-brand-orange pb-1 inline-block">Certificates</h2>
                             <div className="space-y-2">
                               {cvData.certificates.map((cert, i) => cert.name && (
                                  <div key={i}>
                                     <h3 className="text-[10px] font-black">{cert.name}</h3>
                                     <p className="text-[9px] text-gray-500">{cert.organization} ({cert.year})</p>
                                  </div>
                               ))}
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
