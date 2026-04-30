import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, Github, ExternalLink, 
  Briefcase, User, Calendar, Edit3, Plus, 
  Trash2, Save, X, Globe, Code, LayoutDashboard,
  MessageSquare, Linkedin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthService } from '../services/authService';
import Header from './common/Header';
import ProfileEditor from './student/ProfileEditor';
import CVGenerator from './student/CVGenerator';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [group, setGroup] = useState(null);
  const [groupRank, setGroupRank] = useState({ rank: 0, total: 0 });
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [submissionLink, setSubmissionLink] = useState('');
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', tech: '', link: '', description: '' });

  const [gpa, setGpa] = useState(0);

  useEffect(() => {
    fetchMainData();
    fetchProjects();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/student/logs/${user.uid}`);
      const data = await res.json();
      setLogs(data.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMainData = async () => {
    try {
      const gRes = await fetch('/api/admin/groups');
      const allGroups = await gRes.json();
      const myGroup = allGroups.find(g => g.students.includes(user.uid));
      setGroup(myGroup);

      if (myGroup) {
        const tRes = await fetch(`/api/tasks/${myGroup.id}`);
        const tasksData = await tRes.json();
        setTasks(tasksData);

        const uRes = await fetch('/api/admin/users');
        const sRes = await fetch(`/api/submissions/group/${myGroup.id}`);
        const allUsers = await uRes.json();
        const allSubs = await sRes.json();
        
        // Find me in users to get fresh attendance
        const me = allUsers.find(u => u.uid === user.uid);
        if (me) setUser(me);

        const studentsInGroup = allUsers.filter(u => u.groupId === myGroup.id && u.role === 'student');
        
        const ranked = studentsInGroup.map(s => {
          const userSubs = allSubs.filter(sub => sub.uid === s.uid && sub.score !== null);
          const avgScore = userSubs.length > 0 
            ? userSubs.reduce((acc, curr) => acc + curr.score, 0) / userSubs.length 
            : 0;
          return { ...s, avgScore };
        }).sort((a, b) => b.avgScore - a.avgScore);

        const myRank = ranked.findIndex(u => u.uid === user.uid) + 1;
        setGroupRank({ rank: myRank, total: ranked.length });

        const mySubs = allSubs.filter(sub => sub.uid === user.uid && sub.score !== null);
        const myGpa = mySubs.length > 0 
          ? mySubs.reduce((acc, curr) => acc + curr.score, 0) / mySubs.length 
          : 0;
        setGpa(myGpa.toFixed(1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/student/projects/${user.uid}`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (updatedUser) => {
    try {
      const res = await fetch(`/api/student/profile/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        AuthService.updateCurrentUser(data); // Sync local storage if needed
        setIsEditingProfile(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title || !newProject.tech) return;
    
    // Normalize link
    const normalizedLink = newProject.link 
      ? (newProject.link.includes('://') ? newProject.link : `https://${newProject.link}`) 
      : 'https://github.com/';

    try {
      const res = await fetch(`/api/student/projects/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProject,
          link: normalizedLink
        })
      });
      if (res.ok) {
        fetchProjects();
        setNewProject({ title: '', tech: '', link: '', description: '' });
        setShowProjectModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeProject = async (id) => {
    try {
      const res = await fetch(`/api/student/projects/${user.uid}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <Header title="Tələbə Paneli" user={user} />
      
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 text-left">
        <div className="w-full lg:w-auto">
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            Status: <span className="text-brand-orange font-black uppercase tracking-widest text-[10px] bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-orange/20">
              {group?.name || 'Qrup Təyin Edilməyib'}
            </span>
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-brand-card p-1 rounded-xl border border-brand-border w-full lg:w-auto overflow-x-auto no-scrollbar scroll-smooth">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={16} />} label="Dashboard" />
          <TabButton active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase size={16} />} label="Layihələr" />
          <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar size={16} />} label="Cədvəl" />
          <TabButton active={activeTab === 'activity'} onClick={() => { setActiveTab('activity'); fetchLogs(); }} icon={<Clock size={16} />} label="Aktivlik" />
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={16} />} label="Profil" />
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock size={14} className="text-brand-orange" />
                  Gözləyən Tapşırıqlar
                </h3>
                <div className="space-y-4">
                  {tasks.map(task => (
                    <TaskItem 
                      key={task.id}
                      title={task.title}
                      desc={task.desc}
                      deadline={task.deadline}
                      status={task.isActive ? 'New' : 'Inactive'}
                      onClick={() => {
                        if (!task.isActive) return;
                        setIsSubmittingTask(false);
                        setSubmissionLink('');
                        setSelectedTask(task);
                      }}
                    />
                  ))}
                  {tasks.length === 0 && (
                    <div className="py-12 text-center bg-brand-surface border border-dashed border-brand-border rounded-2xl">
                       <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Hələlik tapşırıq yoxdur</p>
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {selectedTask && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                  >
                    <motion.div 
                      layoutId={`task-${selectedTask.id}`}
                      className="bg-brand-card border border-brand-border p-5 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] relative custom-scrollbar"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <span className="text-[10px] font-black uppercase text-brand-orange tracking-widest bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20 mb-3 inline-block">
                              Tapşırıq Təfərrüatı
                            </span>
                            <h3 className="text-3xl font-black text-brand-text">{selectedTask.title}</h3>
                          </div>
                          <button onClick={() => {
                            setSelectedTask(null);
                            setIsSubmittingTask(false);
                            setSubmissionLink('');
                          }} className="p-2 bg-brand-surface border border-brand-border rounded-xl text-gray-500 hover:text-brand-orange transition-all">
                            <X size={20} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                          <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Maksimum Bal</p>
                            <p className="text-xl font-black text-brand-orange">100 Bal</p>
                          </div>
                          <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Son Tarix</p>
                            <p className="text-sm font-black text-brand-text">{selectedTask.deadline}</p>
                          </div>
                          <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                            <p className={`text-sm font-black ${selectedTask.isActive ? 'text-green-500' : 'text-red-500'}`}>
                              {selectedTask.isActive ? 'Aktiv' : 'Deaktiv'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {!isSubmittingTask ? (
                            <>
                              <div>
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Təsvir</h4>
                                <p className="text-gray-400 leading-relaxed font-medium">{selectedTask.desc}</p>
                              </div>

                              {selectedTask.requirements && selectedTask.requirements.length > 0 && (
                                <div>
                                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Tələblər</h4>
                                  <ul className="space-y-3">
                                    {selectedTask.requirements.map((req, i) => (
                                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(223,255,0,0.5)]"></div>
                                        {req}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-6 py-4"
                            >
                              <div className="p-4 bg-brand-orange/5 border border-brand-orange/20 rounded-2xl">
                                <p className="text-xs text-brand-orange font-bold flex items-center gap-2">
                                  <Github size={14} /> Tapşırığı göndərmək üçün linki daxil edin
                                </p>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Github Repozitoriya Linki</label>
                                <input 
                                  autoFocus
                                  type="url"
                                  value={submissionLink}
                                  onChange={(e) => setSubmissionLink(e.target.value)}
                                  placeholder="https://github.com/istifadəçi/tapşırıq"
                                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-4 text-sm focus:border-brand-orange outline-none text-brand-text font-mono"
                                />
                              </div>
                              <p className="text-[10px] text-gray-500 font-medium italic">
                                * Göndərildikdən sonra mentor tərəfindən yoxlanılacaq.
                              </p>
                            </motion.div>
                          )}
                        </div>

                        <div className="mt-10 pt-8 border-t border-brand-border flex gap-4">
                          {!isSubmittingTask ? (
                            <>
                              <button 
                                onClick={() => setIsSubmittingTask(true)}
                                className="flex-1 py-4 bg-brand-orange text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                              >
                                 Tapşırığı Göndər
                              </button>
                              <button className="px-6 py-4 bg-brand-surface border border-brand-border text-brand-text rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-brand-orange transition-all">
                                 Suala bax
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={async () => {
                                  if (!submissionLink) return;
                                  try {
                                    const res = await fetch(`/api/student/submissions/${user.uid}/${selectedTask.id}`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ githubLink: submissionLink })
                                    });
                                    if (res.ok) {
                                      alert('Tapşırıq uğurla göndərildi!');
                                      setSelectedTask(null);
                                      setIsSubmittingTask(false);
                                      setSubmissionLink('');
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="flex-1 py-4 bg-brand-orange text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                              >
                                 Təsdiqlə və Göndər
                              </button>
                              <button 
                                onClick={() => {
                                  setIsSubmittingTask(false);
                                  setSubmissionLink('');
                                }}
                                className="px-6 py-4 bg-brand-surface border border-brand-border text-brand-text rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-brand-orange transition-all"
                              >
                                 Geri
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-brand-orange" />
                  Akademik Vəziyyət
                </h3>
                <div className="bg-brand-card rounded-2xl border border-brand-border p-6 md:p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                  <div className="relative z-10">
                    <h4 className="font-black mb-4 md:mb-6 text-[10px] uppercase tracking-widest text-gray-500">Ümumi nəticə</h4>
                    <div className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-brand-orange">{gpa}</div>
                    <div className="mt-6 md:mt-8 space-y-3 md:space-y-4 pt-6 border-t border-brand-border">
                      <GradeRow label="Davamiyyət" value={`${user.attendance || 0}%`} />
                      <GradeRow label="Aktivlik" value={user.attendance > 90 ? "Yüksək" : user.attendance > 75 ? "Normal" : "Aşağı"} />
                      <GradeRow label="Təqaüd" value={user.scholarship || "0%"} />
                    </div>
                  </div>
                </div>

                {/* Teacher Feedbacks */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MessageSquare size={14} className="text-brand-orange" />
                    Müəllim və Mentor Rəyləri
                  </h3>
                  <div className="space-y-4">
                    {user.feedbacks && user.feedbacks.length > 0 ? (
                      user.feedbacks.slice().reverse().map(fb => (
                        <div key={fb.id} className="bg-brand-card p-6 rounded-2xl border border-brand-border">
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${fb.type === 'teacher' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-blue-500/10 text-blue-400'}`}>
                              {fb.type === 'teacher' ? 'Trener' : 'Mentor'}
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono">{new Date(fb.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-brand-text font-medium leading-relaxed italic">"{fb.content}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-brand-card p-8 rounded-2xl border border-brand-border border-dashed text-center">
                        <p className="text-xs text-gray-500 font-black uppercase tracking-widest opacity-50">Hələlik heç bir rəy qeyd olunmayıb</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Portfolio Layihələrim</h3>
                <button 
                  onClick={() => setShowProjectModal(true)}
                  className="px-4 py-2 bg-brand-orange text-brand-dark text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-opacity-90 flex items-center gap-2 shadow-lg shadow-brand-orange/10"
                >
                  <Plus size={14} /> Yeni Layihə
                </button>
              </div>

              <AnimatePresence>
                {showProjectModal && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-brand-card border border-brand-border p-8 rounded-3xl w-full max-w-md shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-brand-text">Yeni Layihə Əlavə Et</h3>
                        <button onClick={() => setShowProjectModal(false)} className="text-gray-500 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleAddProject} className="space-y-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Layihənin Adı</label>
                          <input 
                            required
                            type="text" 
                            value={newProject.title}
                            onChange={e => setNewProject({...newProject, title: e.target.value})}
                            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
                            placeholder="Məs: Div Academy Dashboard"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Texnologiyalar</label>
                          <input 
                            required
                            type="text" 
                            value={newProject.tech}
                            onChange={e => setNewProject({...newProject, tech: e.target.value})}
                            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
                            placeholder="Məs: React, Tailwind, Firebase"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Github Linki</label>
                          <input 
                            type="text" 
                            value={newProject.link}
                            onChange={e => setNewProject({...newProject, link: e.target.value})}
                            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none"
                            placeholder="github.com/someone/project"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Qısa Təsvir</label>
                          <textarea 
                            value={newProject.description}
                            onChange={e => setNewProject({...newProject, description: e.target.value})}
                            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none h-20 resize-none"
                            placeholder="Layihə haqqında qısa məlumat..."
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-4 bg-brand-orange text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 transition-all"
                        >
                          Layihəni Paylaş
                        </button>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <div key={project.id} className="bg-brand-card p-6 rounded-2xl border border-brand-border hover:border-brand-orange/30 transition-all group shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-brand-orange/10 rounded-xl">
                        <Code size={20} className="text-brand-orange" />
                      </div>
                      <button 
                        onClick={() => removeProject(project.id)}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h4 className="text-brand-text font-black text-lg mb-1">{project.title}</h4>
                    <p className="text-xs text-brand-orange font-bold mb-2">{project.tech}</p>
                    <p className="text-[11px] text-gray-500 mb-6 font-medium line-clamp-2">{project.description}</p>
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-between w-full p-3 bg-brand-surface rounded-xl border border-brand-border text-[10px] font-black uppercase tracking-widest text-brand-text hover:bg-brand-orange hover:text-brand-dark transition-all"
                    >
                      <span>Github Repozitoriya</span>
                      <Github size={16} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Dərs Cədvəli: {group?.name}</h3>
                  <div className="text-[10px] font-black uppercase text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20">
                    Modul: {group?.module || 'Frontend Development'}
                  </div>
                </div>
                <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-7 border-b border-brand-border min-w-[700px]">
                      {['B.e.', 'Ç.a.', 'Çərş.', 'C.a.', 'Cuma', 'Şənbə', 'Bazar'].map(day => (
                        <div key={day} className={`p-4 text-center border-r border-brand-border last:border-0 ${group?.schedule?.days.includes(day) ? 'bg-brand-orange/5 text-brand-orange font-black' : 'text-gray-600'}`}>
                          <p className="text-xs">{day}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-8 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-brand-surface rounded-2xl border border-brand-border">
                        <Clock size={16} className="text-brand-orange" />
                        <span className="text-lg font-black font-mono text-brand-text">{group?.schedule?.time || 'Təyin edilməyib'}</span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Bu həftə: React State & Hooks</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Qrup Daxili Sıralama</h3>
                <div className="bg-brand-card p-8 rounded-2xl border border-brand-border shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full border-4 border-brand-orange/20 flex items-center justify-center">
                      <span className="text-3xl font-black text-brand-orange">{groupRank.rank}</span>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-brand-orange text-brand-dark px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                      Pillə
                    </div>
                  </div>
                  <p className="text-sm font-bold text-brand-text mb-1">Mövqeyiniz</p>
                  <p className="text-xs text-gray-500 font-medium">Toplam {groupRank.total} tələbə arasında {groupRank.rank}-ci yer</p>
                  
                  <div className="mt-8 w-full space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase text-gray-500 tracking-widest">
                      <span>Proqress</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-surface rounded-full overflow-hidden border border-brand-border">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        className="h-full bg-brand-orange"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Son hərəkətlərim</h3>
              </div>
              <div className="bg-brand-card rounded-3xl border border-brand-border p-8">
                <div className="space-y-6">
                  {logs.map((log, index) => (
                    <div key={log.id || index} className="flex gap-6 items-start">
                      <div className="mt-1 w-2 h-2 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(223,255,0,0.5)] shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <p className="text-sm font-bold text-brand-text">{log.description}</p>
                          <div className="flex items-center gap-2.5 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl self-center sm:self-auto shadow-lg shadow-red-500/5">
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Silinməyə:</span>
                            <span className="text-xs font-black text-white">
                              {Math.max(0, 30 - Math.floor((new Date() - new Date(log.timestamp)) / (1000 * 60 * 60 * 24)))} gün
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                          <span>{new Date(log.timestamp).toLocaleString('az-AZ')}</span>
                          <span className="uppercase tracking-widest bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded text-[8px]">{log.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="py-20 text-center">
                      <p className="text-xs font-black uppercase text-gray-500 tracking-widest">Hələlik aktivlik yoxdur</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-brand-card rounded-3xl border border-brand-border p-8 text-center space-y-6 shadow-sm">
                     <div className="w-32 h-32 rounded-full bg-brand-orange/10 border-4 border-brand-surface mx-auto flex items-center justify-center text-4xl font-black text-brand-orange">
                        {user.name.charAt(0)}
                     </div>
                     <div>
                        <h4 className="text-2xl font-black text-brand-text">{user.name}</h4>
                        <p className="text-xs text-brand-orange font-black uppercase tracking-[0.2em] mt-1">{user.role}</p>
                     </div>
                     <button 
                       onClick={() => setIsEditingProfile(!isEditingProfile)}
                       className="w-full py-3 bg-brand-surface border border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-text hover:bg-brand-orange hover:text-brand-dark transition-all flex items-center justify-center gap-2"
                     >
                       <Edit3 size={14} /> Profili Redaktə Et
                     </button>
                  </div>
               </div>

               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-brand-card rounded-3xl border border-brand-border p-8">
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Şəxsi Məlumatlar</h3>
                        {isEditingProfile && (
                           <div className="flex gap-2">
                              <button onClick={() => setIsEditingProfile(false)} className="p-2 text-gray-500 hover:text-red-400 font-bold text-xs">Ləğv et</button>
                           </div>
                        )}
                     </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ProfileField label="Tam Ad" value={user.name} />
                      <ProfileField label="Email" value={user.email} />
                      <ProfileField label="Ata Adı" value={user.patronymic} />
                      <ProfileField label="Təvəllüd" value={user.dob} />
                      <ProfileField label="Universitet" value={user.university} />
                      <ProfileField label="İxtisas" value={user.specialty} />
                      <ProfileField label="Telefon" value={user.phone} />
                      <ProfileField 
                        label="Yumşaq Bacarıqlar" 
                        value={user.softSkills} 
                        isPills 
                        pillClass="bg-gray-600 text-white"
                      />
                      <ProfileField 
                        label="Kompüter Bilikləri" 
                        value={user.computerSkills} 
                        isPills 
                        pillClass="bg-brand-orange text-white"
                      />
                      <ProfileField label="Təqaüd" value={user.scholarship} />
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4">
                        {user.githubLink && (
                          <a 
                            href={user.githubLink.includes('://') ? user.githubLink : `https://${user.githubLink}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs font-bold text-brand-text hover:border-brand-orange transition-all"
                          >
                             <Github size={14} className="text-brand-orange" /> GitHub
                          </a>
                       )}
                       {user.linkedinLink && (
                          <a 
                            href={user.linkedinLink.includes('://') ? user.linkedinLink : `https://${user.linkedinLink}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs font-bold text-brand-text hover:border-brand-orange transition-all"
                          >
                             <Linkedin size={14} className="text-brand-orange" /> LinkedIn
                          </a>
                       )}
                    </div>

                    <AnimatePresence>
                      {isEditingProfile && (
                        <ProfileEditor 
                          user={user} 
                          onSave={handleUpdateProfile} 
                          onCancel={() => setIsEditingProfile(false)} 
                        />
                      )}
                    </AnimatePresence>

                     <div className="mt-8 pt-8 border-t border-brand-border">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Təhlükəsizlik: Şifrəni Dəyiş</h3>
                        <PasswordChangeForm userId={user.uid} />
                     </div>

                     <div className="mt-12 pt-12 border-t border-brand-border">
                        <CVGenerator user={user} projects={projects} />
                     </div>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PasswordChangeForm({ userId }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: 'Şifrə uğurla dəyişdirildi!' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setMsg({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Xəta baş verdi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase font-black">Cari Şifrə</label>
        <input 
          type="password" 
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2 text-sm focus:border-brand-orange outline-none transition-all"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase font-black">Yeni Şifrə</label>
        <input 
          type="password" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2 text-sm focus:border-brand-orange outline-none transition-all"
        />
      </div>
      <div className="flex items-end">
        <button 
          disabled={loading}
          type="submit"
          className="w-full h-[41px] bg-brand-orange text-brand-dark text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? 'Gözləyin...' : 'Güncəllə'}
        </button>
      </div>
      {msg.text && (
        <p className={`col-span-full text-[10px] font-black uppercase tracking-widest mt-2 ${msg.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-brand-orange text-brand-dark shadow-lg shadow-brand-orange/20' : 'text-gray-500 hover:text-brand-text hover:bg-brand-surface'}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ProfileField({ label, value, isPills, pillClass }) {
   return (
      <div className="space-y-1 text-left">
         <p className="text-[9px] text-gray-500 uppercase font-black">{label}</p>
         <div className="pb-2 border-b border-brand-border h-full">
           {isPills && value ? (
              <div className="flex flex-wrap gap-1 py-1">
                {value.split(',').map((s, i) => (
                  <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${pillClass || 'bg-brand-surface'}`}>
                    {s.trim()}
                  </span>
                ))}
              </div>
           ) : (
              <p className="text-sm font-bold text-brand-text">{value || '---'}</p>
           )}
         </div>
      </div>
   );
}

function GradeRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-gray-500 uppercase font-black tracking-tight">{label}</span>
      <span className="text-xs font-black font-mono text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-orange/10">{value}</span>
    </div>
  );
}

function TaskItem({ title, desc, deadline, status, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-brand-card p-4 md:p-6 rounded-2xl border border-brand-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 group hover:border-brand-orange/30 transition-all cursor-pointer text-left"
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h4 className="font-black text-base md:text-lg text-brand-text group-hover:text-brand-orange transition-colors">{title}</h4>
          <StatusBadgeSmall status={status} />
        </div>
        <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6 leading-relaxed font-medium line-clamp-2 md:line-clamp-none">{desc}</p>
        <div className="flex items-center gap-6 text-[9px] md:text-[10px] uppercase font-black tracking-widest text-gray-600">
          <span className="flex items-center gap-1.5"><Clock size={12} className="text-brand-orange" /> Deadline: {deadline}</span>
        </div>
      </div>
      <div className="flex md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-brand-border pt-4 md:pt-0 md:pl-6" onClick={e => e.stopPropagation()}>
        <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-brand-surface border border-brand-border text-gray-500 rounded-xl hover:text-brand-orange hover:border-brand-orange/30 transition-all">
          <Github size={18} />
          <span className="md:hidden text-[9px] font-black uppercase tracking-widest">Repozitoriya</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-brand-surface border border-brand-border text-gray-500 rounded-xl hover:text-brand-orange hover:border-brand-orange/30 transition-all">
          <ExternalLink size={18} />
          <span className="md:hidden text-[9px] font-black uppercase tracking-widest">Baxış</span>
        </button>
      </div>
    </div>
  );
}

function StatusBadgeSmall({ status }) {
  return (
    <span className={`text-[9px] uppercase font-black tracking-tighter px-2 py-0.5 rounded-md border ${
      status === 'New' 
        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
        : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
    }`}>
      {status}
    </span>
  );
}
