import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, CheckSquare, Clock, 
  GraduationCap, Star, BookOpen, ExternalLink,
  MessageCircle, Layout, Plus, Check, X,
  ChevronRight, Trash2, Github, AlertCircle,
  Zap, Target, Search, Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthService } from '../services/authService';
import { Role } from '../constants';

import Header from './common/Header';
import GroupJournal from './common/GroupJournal';

export default function TeacherDashboard() {
  const [user] = useState(AuthService.getCurrentUser());
  const [groups, setGroups] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState('groups'); // groups, all-students, schedule, journal
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gRes, uRes, sRes] = await Promise.all([
        fetch('/api/admin/groups'),
        fetch('/api/admin/users'),
        fetch('/api/admin/users') // To be replaced by a proper submissions fetch or similar if needed
      ]);
      const gData = await gRes.json();
      const uData = await uRes.json();
      
      const myGroups = gData.filter(g => 
        g.teacherId === user.uid || g.mentorId === user.uid
      );
      setGroups(myGroups);

      // Get students only from my groups
      const myGroupIds = myGroups.map(g => g.id);
      const myStudents = uData.filter(u => u.role === Role.Student && myGroupIds.includes(u.groupId));
      
      // Fetch all submissions for these students (we need a way to get all submissions, 
      // but for now, let's fetch for each group or use a generic admin endpoint if exists)
      // Since it's a prototype/small app, let's assume we can fetch all submissions via /api/submissions/group/{id} for each
      const submissionsPromises = myGroupIds.map(gid => fetch(`/api/submissions/group/${gid}`).then(r => r.json()));
      const nestedSubmissions = await Promise.all(submissionsPromises);
      const flattenedSubs = nestedSubmissions.flat();
      setAllSubmissions(flattenedSubs);

      // Calculate GPA for each student
      const studentsWithGPA = myStudents.map(s => {
        const studentSubs = flattenedSubs.filter(sub => sub.uid === s.uid && sub.score !== null);
        const avgScore = studentSubs.length > 0 
          ? studentSubs.reduce((acc, curr) => acc + curr.score, 0) / studentSubs.length 
          : 0;
        return { ...s, avgScore: avgScore.toFixed(1) };
      });

      setAllStudents(studentsWithGPA);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedGroup) {
    return (
      <GroupManagementView 
        group={selectedGroup} 
        onBack={() => {
          setSelectedGroup(null);
          fetchData(); // Refresh global data when coming back
        }} 
        user={user}
      />
    );
  }

  const filteredStudents = allStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <Header title={user.role === Role.Teacher ? 'Trener Paneli' : 'Mentor Paneli'} user={user} />
      
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex bg-brand-card p-1 rounded-2xl border border-brand-border w-full lg:w-auto overflow-x-auto no-scrollbar">
           <TabButton active={activeMainTab === 'groups'} onClick={() => setActiveMainTab('groups')} label="Qruplarım" icon={<Layout size={16} />} />
           <TabButton active={activeMainTab === 'all-students'} onClick={() => setActiveMainTab('all-students')} label="Tələbə Bazası" icon={<Users size={16} />} />
           <TabButton active={activeMainTab === 'schedule'} onClick={() => setActiveMainTab('schedule')} label="Cədvəl" icon={<Calendar size={16} />} />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
           <button 
             onClick={() => setShowPasswordModal(true)}
             className="flex-1 lg:flex-none bg-brand-card border border-brand-border px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-text hover:border-brand-orange transition-all font-mono"
           >
             Şifrəni Dəyiş
           </button>

           <div className="flex-1 lg:flex-none bg-brand-orange/5 border border-brand-orange/20 px-6 py-3 rounded-2xl text-right flex flex-col items-end min-w-[140px]">
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 font-mono">Reytinq</p>
              <div className="flex items-center gap-1.5">
                <Star className="text-brand-orange fill-brand-orange" size={16} />
                <span className="text-xl font-black text-brand-orange font-mono">4.9 / 5</span>
              </div>
           </div>
        </div>
      </header>

      {activeMainTab === 'groups' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          {/* Teacher Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TeacherStatCard label="Aktiv Tələbə" value={groups.reduce((acc, g) => acc + g.students.length, 0)} icon={<Users className="text-brand-orange" />} />
            <TeacherStatCard 
              label="Ortalama Bal" 
              value={(allStudents.reduce((acc, s) => acc + (parseFloat(s.avgScore) || 0), 0) / (allStudents.length || 1)).toFixed(1) + '%'} 
              icon={<GraduationCap className="text-brand-orange" />} 
            />
            <TeacherStatCard label="Təyin olunmuş Qruplar" value={groups.length} icon={<Layout className="text-brand-orange" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Users size={14} className="text-brand-orange" />
                Güncel Tədris Qruplarım
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map(group => (
                  <GroupDetailCard 
                    key={group.id} 
                    group={group} 
                    isTeacher={user.uid === group.teacherId} 
                    onClick={() => setSelectedGroup(group)}
                  />
                ))}
                {groups.length === 0 && !loading && (
                  <div className="col-span-full py-20 text-center bg-brand-card rounded-3xl border border-dashed border-brand-border">
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Hələlik heç bir qrup təyin edilməyib</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Calendar size={14} className="text-brand-orange" />
                Növbəti Dərslər
              </h3>
              <div className="bg-brand-card rounded-3xl border border-brand-border p-6 space-y-4">
                {groups.map(g => (
                  <ScheduleItem key={g.id} group={g.name} time={g.schedule.time} topic="Aktiv Tədris Modulu" days={g.schedule.days} />
                ))}
                {groups.length === 0 && (
                  <p className="text-center py-8 text-xs text-gray-600 font-black italic">Gözləyən dərs yoxdur</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeMainTab === 'all-students' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div>
                 <h3 className="text-xl font-black text-brand-text uppercase leading-none">Ümumi Tələbə Bazası</h3>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Daxil olduğunuz bütün qruplar üzrə statistik cədvəl</p>
              </div>
              <div className="relative w-full md:w-80">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                 <input 
                   type="text"
                   placeholder="Tələbə axtar..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pl-11 pr-4 py-3 bg-brand-card border border-brand-border rounded-2xl text-xs font-medium focus:border-brand-orange outline-none transition-all text-brand-text"
                 />
              </div>
           </div>

           <div className="bg-brand-card rounded-[40px] border border-brand-border overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                 <table className="w-full text-left min-w-[700px]">
                    <thead>
                       <tr className="bg-brand-surface border-b border-brand-border">
                          <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Tələbə Şəxs</th>
                          <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Qrup</th>
                          <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">GPA (100)</th>
                          <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">GPA (4.0)</th>
                          <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Davamiyyət</th>
                          <th className="px-8 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right">Fəallıq</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                       {filteredStudents.map(student => {
                         const groupOfStudent = groups.find(g => g.id === student.groupId);
                         const gpa4 = (parseFloat(student.avgScore) / 25).toFixed(1);
                         
                         return (
                           <tr key={student.uid} className="hover:bg-brand-surface/30 transition-colors group cursor-pointer" onClick={() => {
                             setSelectedGroup(groupOfStudent);
                           }}>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-[11px] font-black text-brand-orange group-hover:scale-110 transition-transform">
                                       {student.name.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-brand-text">{student.name}</p>
                                       <p className="text-[10px] text-gray-500 font-medium">{student.email}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <span className="text-[10px] font-black text-brand-text/70 uppercase bg-brand-surface px-2.5 py-1 rounded-lg border border-brand-border">
                                    {groupOfStudent?.name || 'Yoxdur'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 font-mono text-sm font-black text-brand-orange">{student.avgScore}%</td>
                              <td className="px-8 py-5 font-mono text-sm font-black text-brand-text">{gpa4}</td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-3">
                                    <div className="w-20 h-1 bg-brand-surface rounded-full overflow-hidden border border-brand-border">
                                       <div className="h-full bg-brand-orange" style={{ width: `${student.attendance || 0}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 font-mono">{student.attendance || 0}%</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${student.attendance > 90 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'}`}>
                                    {student.attendance > 90 ? 'Yüksək' : student.attendance > 75 ? 'Normal' : 'Aşağı'}
                                 </span>
                              </td>
                           </tr>
                         );
                       })}
                       {filteredStudents.length === 0 && (
                         <tr>
                            <td colSpan="6" className="px-8 py-20 text-center text-gray-600 italic text-[11px] font-black uppercase">Heç bir tələbə tapılmadı</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </motion.div>
      )}

      {activeMainTab === 'schedule' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
           <div className="bg-brand-card p-10 rounded-[48px] border border-brand-border overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-brand-text uppercase leading-none">Ümumi Akademik Cədvəl</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">{groups.length} qrup üzrə ümumi həftəlik plan</p>
                 </div>
                 <Calendar className="text-brand-orange opacity-20" size={60} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {groups.map(g => (
                   <div key={g.id} className="p-6 bg-brand-surface rounded-3xl border border-brand-border hover:border-brand-orange/30 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                         <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange group-hover:scale-110 transition-transform">
                            <Clock size={20} />
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Vaxt</p>
                            <p className="text-sm font-black text-brand-text font-mono">{g.schedule.time}</p>
                         </div>
                      </div>
                      <h4 className="text-lg font-black text-brand-text uppercase mb-4 leading-tight">{g.name}</h4>
                      <div className="flex flex-wrap gap-2">
                         {g.schedule.days.map(d => (
                            <span key={d} className="px-2 py-1 bg-brand-card border border-brand-border rounded-lg text-[10px] font-black text-brand-orange uppercase">{d}</span>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border">
                 <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Target size={16} className="text-red-400" />
                    Mühüm İmtahan Tarixləri
                 </h4>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-brand-surface rounded-2xl border border-brand-border">
                       <div>
                          <p className="text-sm font-bold text-brand-text">Modul 1: Yekun İmtahan</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black font-mono">15 May, 19:00</p>
                       </div>
                       <span className="text-[8px] font-black bg-red-500/10 text-red-400 px-2 py-1 rounded uppercase">Yüksək Prioritet</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-brand-surface rounded-2xl border border-brand-border">
                       <div>
                          <p className="text-sm font-bold text-brand-text">Layihə Müdafiəsi</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black font-mono">22 İyun, 10:00</p>
                       </div>
                       <span className="text-[8px] font-black bg-blue-500/10 text-blue-400 px-2 py-1 rounded uppercase">Planlaşdırılıb</span>
                    </div>
                 </div>
              </div>

              <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border">
                 <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <CheckSquare size={16} className="text-green-400" />
                    Mentor Tapşırıqları
                 </h4>
                 <div className="p-6 bg-brand-orange/5 rounded-3xl border border-brand-orange/20 text-center">
                    <Zap className="text-brand-orange mx-auto mb-3" size={24} />
                    <p className="text-sm font-bold text-brand-text leading-relaxed">Tezliklə yeni tənzimləmə mövzuları və texniki sessiya cədvəli əlavə olunacaq.</p>
                 </div>
              </div>
           </div>
        </motion.div>
      )}

      {/* Password Modal */}

      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-card border border-brand-border p-6 md:p-8 rounded-[24px] md:rounded-[32px] w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-orange transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-xl font-black text-brand-text uppercase tracking-tight mb-4">Şifrəni Yenilə</h3>
              <PasswordChangeUI userId={user.uid} onSuccess={() => setShowPasswordModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PasswordChangeUI({ userId, onSuccess }) {
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
        setTimeout(() => onSuccess(), 1500);
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
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase font-black">Cari Şifrə</label>
        <input 
          type="password" 
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none transition-all text-brand-text"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase font-black">Yeni Şifrə</label>
        <input 
          type="password" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none transition-all text-brand-text"
        />
      </div>
      <button 
        disabled={loading}
        type="submit"
        className="w-full py-4 bg-brand-orange text-brand-dark text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg"
      >
        {loading ? 'Gözləyin...' : 'Güncəllə'}
      </button>
      {msg.text && (
        <p className={`text-center text-[10px] font-black uppercase tracking-widest mt-2 ${msg.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}

function GroupDetailCard({ group, isTeacher, onClick }) {
  return (
    <div className="bg-brand-card rounded-3xl border border-brand-border hover:border-brand-orange/30 transition-all group p-6 flex flex-col justify-between h-full">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
           <h4 className="text-xl font-black text-brand-text uppercase tracking-tight">{group.name}</h4>
           <span className="text-[8px] font-black uppercase tracking-widest bg-brand-orange/5 text-brand-orange px-2 py-1 rounded border border-brand-orange/10">
             {isTeacher ? 'Trener' : 'Mentor'}
           </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
           {group.schedule.days.map(d => (
             <span key={d} className="text-[9px] font-black bg-brand-surface text-gray-400 px-1.5 py-0.5 rounded border border-brand-border">{d}</span>
           ))}
           <span className="text-[9px] font-black bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded">{group.schedule.time}</span>
        </div>
      </div>

      <div className="space-y-4">
         <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-2xl border border-brand-border">
            <BookOpen size={16} className="text-gray-500" />
            <div className="flex-1 min-w-0">
               <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Syllabus</p>
               <a href={group.syllabus} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-brand-orange flex items-center gap-1 hover:underline truncate">
                 Tədris proqramına bax <ExternalLink size={10} />
               </a>
            </div>
         </div>

         <div className="flex gap-2">
            <button 
              onClick={onClick}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-text hover:bg-brand-orange hover:text-brand-dark transition-all"
            >
               <Layout size={14} /> İdarə et
            </button>
            <button className="p-2.5 bg-brand-surface border border-brand-border rounded-xl text-gray-500 hover:text-brand-orange transition-all">
               <MessageCircle size={18} />
            </button>
         </div>
      </div>
    </div>
  );
}

function GroupManagementView({ group, onBack, user }) {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks'); // tasks, submissions, students, journal, grades, schedule
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [newAttendance, setNewAttendance] = useState({}); // { studentId: 'present'|'absent' }
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', desc: '', deadline: '', requirements: '' });
  const [gradingSub, setGradingSub] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });

  useEffect(() => {
    fetchGroupData();
  }, [group.id]);

  const fetchGroupData = async () => {
    try {
      const [tRes, sRes, uRes] = await Promise.all([
        fetch(`/api/tasks/${group.id}`),
        fetch(`/api/submissions/group/${group.id}`),
        fetch('/api/admin/users')
      ]);
      const fetchedTasks = await tRes.json();
      const fetchedSubs = await sRes.json();
      const allUsers = await uRes.json();
      
      setTasks(fetchedTasks);
      setSubmissions(fetchedSubs);
      
      const groupStudents = allUsers.filter(u => u.groupId === group.id && (u.role === 'Student' || u.role === 'student'));
      const rankedStudents = groupStudents.map(s => {
        const userSubs = fetchedSubs.filter(sub => sub.uid === s.uid && sub.score !== null);
        const avgScore = userSubs.length > 0 
          ? userSubs.reduce((acc, curr) => acc + curr.score, 0) / userSubs.length 
          : 0;
        return { ...s, avgScore: avgScore.toFixed(1) };
      }).sort((a, b) => b.avgScore - a.avgScore);
      
      setStudents(rankedStudents);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bu tapşırığı silmək istədiyinizə əminsiniz?')) return;
    try {
      const res = await fetch(`/api/tasks/${group.id}/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: user.name })
      });
      if (!res.ok) throw new Error('Silinmədi');
      fetchGroupData();
    } catch (err) {
      console.error(err);
      alert('Təpşırıq silinərkən xəta baş verdi');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tasks/${group.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          requirements: newTask.requirements.split('\n').filter(r => r.trim() !== '')
        })
      });
      if (res.ok) {
        fetchGroupData();
        setShowTaskModal(false);
        setNewTask({ title: '', desc: '', deadline: '', requirements: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    try {
      await fetch(`/api/tasks/${group.id}/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchGroupData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/submissions/${gradingSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: parseInt(gradeForm.score),
          mentorFeedback: gradeForm.feedback,
          status: 'graded'
        })
      });
      if (res.ok) {
        fetchGroupData();
        setGradingSub(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [group.id]);

  const fetchAttendance = async () => {
    const res = await fetch(`/api/attendance/${group.id}`);
    if (res.ok) setAttendanceLogs(await res.json());
  };

  const handleMarkAttendance = async () => {
    const records = Object.entries(newAttendance).map(([studentId, status]) => ({
      studentId,
      status
    }));

    // Fill missing students as absent by default if needed, or just include what's marked
    const finalRecords = group.students.map(sid => ({
       studentId: sid,
       status: newAttendance[sid] || 'absent'
    }));

    const res = await fetch(`/api/attendance/${group.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: new Date().toISOString(),
        records: finalRecords
      })
    });

    if (res.ok) {
      setIsMarkingAttendance(false);
      setNewAttendance({});
      fetchAttendance();
      fetchGroupData(); // Refresh group data to update student stats
    }
  };

  const handleAddFeedback = async (studentId, content) => {
    const res = await fetch(`/api/feedback/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacherId: user.uid,
        content,
        type: user.role === Role.Teacher ? 'teacher' : 'mentor'
      })
    });
    if (res.ok) {
      alert('Rəy əlavə edildi');
      fetchGroupData();
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <Header title={`${group.name} İdarəetməsi`} user={user} />
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            onClick={onBack}
            className="text-gray-500 hover:text-brand-orange flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2 transition-all"
          >
            <ChevronRight size={14} className="rotate-180" /> Geri Qayıt
          </button>
          <p className="text-gray-500 font-medium italic mt-1">{group.students.length} Tələbə • {group.schedule.time}</p>
        </div>

        <div className="flex bg-brand-card p-1 rounded-2xl border border-brand-border w-full md:w-auto overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Tapşırıqlar" icon={<CheckSquare size={16} />} />
          <TabButton active={activeTab === 'submissions'} onClick={() => setActiveTab('submissions')} label="Yoxlamalar" icon={<GraduationCap size={16} />} />
          <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} label="Tələbələr" icon={<Users size={16} />} />
          <TabButton active={activeTab === 'grades'} onClick={() => setActiveTab('grades')} label="Qiymətlər" icon={<Star size={16} />} />
          <TabButton active={activeTab === 'journal'} onClick={() => setActiveTab('journal')} label="Jurnal" icon={<BookOpen size={16} />} />
          <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} label="Cədvəl" icon={<Calendar size={16} />} />
        </div>
      </header>

      {/* Group Stats Mini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161619] p-4 rounded-3xl border border-[#242427] flex items-center gap-4">
           <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange"><Zap size={16} /></div>
           <div>
              <p className="text-[8px] font-black text-gray-600 uppercase">Orta Bal</p>
              <p className="text-sm font-black text-brand-text">{group.avgGrade}%</p>
           </div>
        </div>
        <div className="bg-[#161619] p-4 rounded-3xl border border-[#242427] flex items-center gap-4">
           <div className="p-3 bg-green-500/10 rounded-2xl text-green-500"><Users size={16} /></div>
           <div>
              <p className="text-[8px] font-black text-gray-600 uppercase">Davamiyyət</p>
              <p className="text-sm font-black text-brand-text">{group.avgAttendance || 88}%</p>
           </div>
        </div>
        <div className="bg-[#161619] p-4 rounded-3xl border border-[#242427] flex items-center gap-4">
           <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Clock size={16} /></div>
           <div>
              <p className="text-[8px] font-black text-gray-600 uppercase">Proqres</p>
              <p className="text-sm font-black text-brand-text">{group.progress}%</p>
           </div>
        </div>
        <div className="bg-[#161619] p-4 rounded-3xl border border-[#242427] flex items-center gap-4">
           <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange"><Target size={16} /></div>
           <div>
              <p className="text-[8px] font-black text-gray-600 uppercase">Tələbə</p>
              <p className="text-sm font-black text-brand-text">{group.students.length}</p>
           </div>
        </div>
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Qrup Tapşırıqları</h3>
            <button 
              onClick={() => setShowTaskModal(true)}
              className="bg-brand-orange text-brand-dark px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-brand-orange/10"
            >
              <Plus size={16} /> Tapşırıq Yarat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map(task => (
              <div key={task.id} className="bg-brand-card p-8 rounded-3xl border border-brand-border hover:border-brand-orange/20 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <h4 className="text-xl font-black text-brand-text">{task.title}</h4>
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${task.isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>
                         {task.isActive ? 'Aktiv' : 'Deaktiv'}
                       </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{task.deadline} • {task.requirements?.length || 0} Tələb</p>
                  </div>
                  <button 
                    onClick={() => toggleTaskStatus(task.id, task.isActive)}
                    className={`p-3 rounded-xl border transition-all ${task.isActive ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-green-500/5 border-green-500/20 text-green-500'}`}
                  >
                    {task.isActive ? 'Pauza' : 'Başlat'}
                  </button>
                </div>
                <div className="flex gap-3">
                   <button className="flex-1 py-3 bg-brand-surface border border-brand-border rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-text">Redaktə et</button>
                   <button onClick={() => handleDeleteTask(task.id)} className="p-3 bg-brand-surface border border-brand-border rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tələbə Göndərişləri</h3>
          <div className="bg-brand-card rounded-3xl border border-brand-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-brand-surface border-b border-brand-border">
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Tələbə</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Tapşırıq</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Bal</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Link</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {submissions.map(sub => {
                    const student = students.find(s => s.uid === sub.uid);
                    const task = tasks.find(t => t.id === sub.taskId);
                    return (
                      <tr key={sub.id} className="hover:bg-brand-surface/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange font-black text-[10px]">
                                {student?.name?.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-brand-text">{student?.name}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-xs font-medium text-gray-400">{task?.title || 'Bilinməyən Task'}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${sub.status === 'graded' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                              {sub.status === 'graded' ? 'Yoxlanılıb' : 'Gözləyir'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-sm font-black font-mono text-brand-orange">{sub.score || '--'}</span>
                        </td>
                        <td className="px-6 py-4">
                           <a href={sub.githubLink} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-brand-orange transition-colors">
                              <Github size={18} />
                           </a>
                        </td>
                        <td className="px-6 py-4">
                           <button 
                             onClick={() => {
                               setGradingSub(sub);
                               setGradeForm({ score: sub.score || '', feedback: sub.mentorFeedback || '' });
                             }}
                             className="text-[10px] font-black uppercase text-brand-orange hover:underline focus:outline-none"
                           >
                             Qiymətləndir
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center text-gray-600 italic text-xs font-black uppercase">Göndərilmiş tapşırıq yoxdur</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div>
                 <h3 className="text-lg font-black text-brand-text uppercase leading-none">Qrup Tələbə Bazası</h3>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">{group.name} üzrə bütün aktiv tələbələr</p>
              </div>
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                 <input 
                   type="text"
                   placeholder="Tələbə axtar..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs font-medium focus:border-brand-orange outline-none transition-all text-brand-text"
                 />
              </div>
           </div>

           <div className="bg-brand-card rounded-[32px] border border-brand-border overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                 <table className="w-full text-left min-w-[700px]">
                    <thead>
                       <tr className="bg-brand-surface border-b border-brand-border">
                          <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Tələbə</th>
                          <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">GPA (100)</th>
                          <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">Davamiyyət</th>
                          <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                          <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right">Əməliyyat</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                       {students
                         .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                         .map((student, i) => (
                           <tr key={student.uid} className="hover:bg-brand-surface/30 transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-[10px] font-black text-brand-orange">
                                       {student.name.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-brand-text">{student.name}</p>
                                       <p className="text-[9px] text-gray-500 font-medium">{student.email}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className="text-xs font-black font-mono text-brand-orange">{student.avgScore}%</span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 h-1 bg-brand-surface rounded-full overflow-hidden">
                                       <div className="h-full bg-brand-orange" style={{ width: `${student.attendance || 0}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 font-mono">{student.attendance || 0}%</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${student.attendance > 90 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'}`}>
                                    {student.attendance > 90 ? 'Yüksək' : 'Normal'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button 
                                   onClick={() => {
                                     const content = prompt(`${student.name} üçün rəy yazın:`);
                                     if (content) handleAddFeedback(student.uid, content);
                                   }}
                                   className="text-[9px] font-black uppercase text-brand-orange opacity-0 group-hover:opacity-100 transition-all hover:underline"
                                 >
                                    Rəy Bildir
                                 </button>
                              </td>
                           </tr>
                         ))}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              {students.slice(0, 3).map((student, i) => (
                <div key={student.uid} className="bg-[#161619] border border-brand-border rounded-3xl p-6 hover:border-brand-orange/30 transition-all flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                     <span className="text-[8px] font-black text-gray-700 font-mono">#{i+1}</span>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-brand-orange/5 border-2 border-brand-orange/20 flex items-center justify-center mb-4">
                    <span className="text-xl font-black text-brand-orange">{student.name.charAt(0)}</span>
                  </div>
                  <h4 className="text-sm font-black text-brand-text mb-1 uppercase tracking-tight">{student.name}</h4>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-6 px-3 py-1 bg-brand-surface rounded-lg">{student.email.split('@')[0]}</p>
                  
                  <div className="w-full pt-4 border-t border-brand-border/50 grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-1">GPA</p>
                        <p className="text-lg font-black text-brand-orange font-mono">{(parseFloat(student.avgScore) / 25).toFixed(1)}</p>
                     </div>
                     <div>
                        <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-1">Qayıb</p>
                        <p className="text-lg font-black text-red-500 font-mono">{100 - (student.attendance || 100)}%</p>
                     </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <motion.div
          key="journal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GroupJournal 
            group={group} 
            students={students} 
            currentUser={user} 
          />
        </motion.div>
      )}

      {activeTab === 'grades' && (
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           className="space-y-6"
        >
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-brand-card p-6 rounded-3xl border border-brand-border md:col-span-1">
                 <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">GPA Analizi (Group Average)</h4>
                 <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-brand-orange">
                       {(students.reduce((acc, s) => acc + (parseFloat(s.avgScore) || 0), 0) / (students.length || 1) / 25).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500 font-bold mb-1">/ 4.0</span>
                 </div>
                 <p className="text-[10px] text-gray-600 font-bold uppercase mt-2">Mükəmməl mənimsəmə göstəricisi</p>
              </div>

              <div className="bg-brand-card p-6 rounded-3xl border border-brand-border md:col-span-2">
                 <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Qiymətləndirmə Metrikası</h4>
                 <div className="flex gap-4">
                    <div className="flex-1 p-4 bg-brand-surface rounded-2xl border border-brand-border">
                       <p className="text-[9px] font-black text-gray-600 uppercase">Tasklar</p>
                       <p className="text-xl font-black text-brand-text">{tasks.length}</p>
                    </div>
                    <div className="flex-1 p-4 bg-brand-surface rounded-2xl border border-brand-border">
                       <p className="text-[9px] font-black text-gray-600 uppercase">Yoxlanılıb</p>
                       <p className="text-xl font-black text-green-500">{submissions.filter(s => s.status === 'graded').length}</p>
                    </div>
                    <div className="flex-1 p-4 bg-brand-surface rounded-2xl border border-brand-border">
                       <p className="text-[9px] font-black text-gray-600 uppercase">Gözləyir</p>
                       <p className="text-xl font-black text-yellow-500">{submissions.filter(s => s.status !== 'graded').length}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-brand-card rounded-[40px] border border-brand-border overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-brand-surface border-b border-brand-border">
                          <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Tələbə</th>
                          {tasks.map(t => (
                            <th key={t.id} className="px-4 py-5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center min-w-[100px]">
                               {t.title.split(' ').slice(0, 2).join(' ')}..
                            </th>
                          ))}
                          <th className="px-6 py-5 text-[9px] font-black text-brand-orange uppercase tracking-widest text-right bg-brand-orange/5">GPA (Avg)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                       {students.map(student => {
                         const studentSubs = submissions.filter(s => s.uid === student.uid);
                         const avg = student.avgScore || 0;
                         const gpa = (avg / 25).toFixed(1); // 100/25 = 4.0 scale

                         return (
                           <tr key={student.uid} className="hover:bg-brand-surface/30 transition-colors">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center text-[10px] font-black text-gray-400">
                                       {student.name.charAt(0)}
                                    </div>
                                    <span className="text-xs font-bold text-brand-text">{student.name}</span>
                                 </div>
                              </td>
                              {tasks.map(t => {
                                const sub = studentSubs.find(s => s.taskId === t.id);
                                return (
                                  <td key={t.id} className="px-4 py-4 text-center">
                                     <span className={`text-xs font-black font-mono ${sub?.score >= 90 ? 'text-green-400' : sub?.score >= 70 ? 'text-brand-orange' : sub?.score ? 'text-red-400' : 'text-gray-700'}`}>
                                        {sub?.score !== undefined ? sub.score : '--'}
                                     </span>
                                  </td>
                                );
                              })}
                              <td className="px-6 py-4 text-right bg-brand-orange/5">
                                 <span className="text-sm font-black text-brand-orange">{gpa}</span>
                              </td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </motion.div>
      )}

      {activeTab === 'schedule' && (
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="space-y-6"
        >
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-brand-card p-10 rounded-[48px] border border-brand-border relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                       <div>
                          <h3 className="text-2xl font-black text-brand-text uppercase leading-none">Dərs Cədvəli</h3>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">{group.name} | Həftəlik Görünüş</p>
                       </div>
                       <div className="flex gap-2">
                          <button className="p-3 bg-brand-surface border border-brand-border rounded-2xl text-gray-500 hover:text-brand-orange transition-all"><ChevronRight size={18} className="rotate-180" /></button>
                          <button className="p-3 bg-brand-surface border border-brand-border rounded-2xl text-gray-500 hover:text-brand-orange transition-all"><ChevronRight size={18} /></button>
                       </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                       {['B.E', 'Ç.A', 'Çər', 'C.A', 'Cüm', 'Şən', 'Baz'].map(day => (
                         <div key={day} className="text-center space-y-4">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{day}</span>
                            <div className="aspect-[2/3] bg-brand-surface rounded-2xl border border-brand-border/50 p-2 flex flex-col justify-center items-center group hover:border-brand-orange/30 transition-all cursor-pointer">
                               {group.schedule.days.includes(day) && (
                                 <div className="w-full h-full bg-brand-orange/10 rounded-xl border border-brand-orange/30 p-2 flex flex-col justify-center items-center text-center">
                                    <Clock size={12} className="text-brand-orange mb-1" />
                                    <span className="text-[9px] font-black text-brand-orange">{group.schedule.time}</span>
                                 </div>
                               )}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 px-2 border-l-2 border-brand-orange">Tezliklə: İmtahanlar & Müdafiələr</h4>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between p-5 bg-brand-surface rounded-3xl border border-brand-border group hover:border-blue-500/30 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Target size={20} /></div>
                             <div>
                                <p className="text-sm font-black text-brand-text uppercase leading-none">Modul 1: İmtahan</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">15 May, 19:00</p>
                             </div>
                          </div>
                          <span className="px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full text-[9px] font-black uppercase border border-blue-500/20">Tezliklə</span>
                       </div>
                       <div className="flex items-center justify-between p-5 bg-brand-surface rounded-3xl border border-brand-border group hover:border-brand-orange/30 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange"><BookOpen size={20} /></div>
                             <div>
                                <p className="text-sm font-black text-brand-text uppercase leading-none">Yekun Layihə Müdafiəsi</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">28 İyun, 10:00</p>
                             </div>
                          </div>
                          <span className="px-4 py-1.5 bg-brand-card text-gray-500 rounded-full text-[9px] font-black uppercase border border-brand-border">Planlaşdırılıb</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-brand-orange p-8 rounded-[40px] text-brand-dark">
                    <Calendar size={32} className="mb-4" />
                    <h4 className="text-xl font-black uppercase leading-none mb-2">Akademik Təqvim</h4>
                    <p className="text-sm font-bold opacity-80 mb-6 font-mono leading-relaxed tracking-tight">Cari semestr üzrə mühüm tarixləri və dəyişiklikləri izləyin.</p>
                    <button className="w-full py-3 bg-brand-dark text-brand-orange rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 transition-all">Bütün illik təqvim</button>
                 </div>

                 <div className="bg-brand-card p-6 rounded-3xl border border-brand-border">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Statistik proqnoz</p>
                    <div className="space-y-4">
                       <div className="flex justify-between items-end border-b border-brand-border pb-2">
                          <span className="text-[11px] font-bold text-gray-400">Ümumi Dərs Saatı</span>
                          <span className="text-lg font-black text-brand-text">72 s.</span>
                       </div>
                       <div className="flex justify-between items-end border-b border-brand-border pb-2">
                          <span className="text-[11px] font-bold text-gray-400">Qalan Dərslər</span>
                          <span className="text-lg font-black text-brand-orange">24 s.</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>
      )}

      {/* Create Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-brand-card border border-brand-border p-6 md:p-8 rounded-[24px] md:rounded-[40px] w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
               <button onClick={() => setShowTaskModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-500 hover:text-brand-orange">
                  <X size={24} />
               </button>
               <h3 className="text-xl md:text-2xl font-black text-brand-text uppercase mb-6 md:mb-8">Yeni Tapşırıq Yarat</h3>
               <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1 col-span-full">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Başlıq</label>
                    <input 
                      required
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none" 
                      placeholder="Məs: React Props & State"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Deadline</label>
                    <input 
                      required
                      type="date"
                      value={newTask.deadline}
                      onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Təxmini Bal</label>
                    <input 
                      required
                      type="number"
                      placeholder="Məs: 100"
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none" 
                    />
                  </div>
                  <div className="space-y-1 col-span-full">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Təsvir</label>
                    <textarea 
                      required
                      value={newTask.desc}
                      onChange={e => setNewTask({...newTask, desc: e.target.value})}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none h-24 no-scrollbar" 
                      placeholder="Tapşırığın məqsədi və hədəfi..."
                    />
                  </div>
                  <div className="space-y-1 col-span-full">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tələblər (Hər sətri bir tələb kimi yazın)</label>
                    <textarea 
                      required
                      value={newTask.requirements}
                      onChange={e => setNewTask({...newTask, requirements: e.target.value})}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-orange outline-none h-32 no-scrollbar" 
                      placeholder="Tələb 1\nTələb 2\nTələb 3..."
                    />
                  </div>
                  <button type="submit" className="col-span-full py-4 bg-brand-orange text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 shadow-xl shadow-brand-orange/10">
                    Tapşırığı Paylaş
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grading Modal */}
      <AnimatePresence>
        {gradingSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/90 backdrop-blur-xl">
             <motion.div 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 50, opacity: 0 }}
               className="bg-brand-card border border-brand-border p-6 md:p-10 rounded-[32px] md:rounded-[48px] w-full max-w-2xl shadow-3xl relative overflow-y-auto max-h-[95vh] no-scrollbar"
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                <button onClick={() => setGradingSub(null)} className="absolute top-10 right-10 text-gray-500 hover:text-brand-orange z-10">
                   <X size={28} />
                </button>

                <div className="relative z-10">
                   <div className="mb-10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20 mb-3 inline-block">Qiymətləndirmə Portalı</span>
                      <h3 className="text-3xl font-black text-brand-text mb-2">Tapşırığı Yoxla</h3>
                      <p className="text-gray-500 font-medium italic">Tələbə: <span className="text-brand-text font-black">{students.find(s => s.uid === gradingSub.uid)?.name}</span></p>
                   </div>

                   <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border mb-10 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Github Repozitoriyası</p>
                        <a href={gradingSub.githubLink} target="_blank" rel="noreferrer" className="text-brand-orange font-bold hover:underline flex items-center gap-2">
                           Layihiyə bax <ExternalLink size={14} />
                        </a>
                      </div>
                      <AlertCircle className="text-brand-orange/50" size={24} />
                   </div>

                   <form onSubmit={handleGrade} className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex justify-between">
                           Bal (0-100)
                           <span className="text-brand-orange">{gradeForm.score}%</span>
                        </label>
                        <input 
                           type="range"
                           min="0"
                           max="100"
                           value={gradeForm.score}
                           onChange={e => setGradeForm({...gradeForm, score: e.target.value})}
                           className="w-full accent-brand-orange h-2 bg-brand-surface rounded-full appearance-none cursor-pointer border border-brand-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mentor Rəyi</label>
                        <textarea 
                           required
                           value={gradeForm.feedback}
                           onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})}
                           className="w-full bg-brand-surface border border-brand-border rounded-2xl px-6 py-5 text-sm focus:border-brand-orange outline-none h-32 no-scrollbar font-medium"
                           placeholder="Kod təmizliyi, struktur və tələblərə uyğunluq barədə fikirləriniz..."
                        />
                      </div>

                      <button type="submit" className="w-full py-5 bg-brand-orange text-brand-dark rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-3">
                         <Check size={20} /> Qiyməti Təsdiqlə
                      </button>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shrink-0 ${active ? 'bg-brand-orange text-brand-dark shadow-sm' : 'text-gray-500 hover:bg-brand-surface'}`}
    >
      {icon}
      <span>{label}</span>
      {active && <motion.div layoutId="activeTabMentor" className="absolute" />}
    </button>
  );
}

function TeacherStatCard({ label, value, icon, isAlert }) {
  return (
    <div className={`bg-brand-card p-6 rounded-3xl border ${isAlert ? 'border-red-500/20' : 'border-brand-border'} relative overflow-hidden group shadow-sm transition-all hover:border-brand-orange/50`}>
      <div className="relative z-10 flex justify-between items-center text-left">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">{label}</p>
          <p className={`text-2xl font-black ${isAlert ? 'text-red-400' : 'text-brand-text'}`}>{value}</p>
        </div>
        <div className="p-3 bg-brand-surface border border-brand-border rounded-2xl group-hover:border-brand-orange/50 transition-all">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ScheduleItem({ group, time, topic, days }) {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-brand-surface rounded-2xl transition-all border border-transparent hover:border-brand-border group text-left">
       <div className="w-14 h-14 rounded-xl bg-brand-surface flex flex-col items-center justify-center border border-brand-border group-hover:border-brand-orange/30 transition-all flex-shrink-0">
          <span className="text-[8px] font-black text-gray-500 uppercase">{days.join(', ')}</span>
          <span className="text-[10px] font-black text-brand-orange">{time}</span>
       </div>
       <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-brand-text truncate">{topic}</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase">{group} Qrupu</p>
       </div>
    </div>
  );
}
