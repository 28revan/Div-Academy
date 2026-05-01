/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, BookOpen, CheckSquare, Wallet, X, Menu, Sun, Moon, Briefcase, Zap, ShieldCheck, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthService } from './services/authService';
import { Role } from './constants';

// Components
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminsList from './components/AdminsList';
import AccountsManagement from './components/AccountsManagement';
import ActivityLog from './components/ActivityLog';
import TrashBin from './components/TrashBin';

// Logo Component
const Logo = ({ className = "" }) => (
  <div className={`flex items-center gap-0.5 relative ${className}`}>
    <div className="absolute -top-1 -left-2 w-4 h-4 bg-brand-orange rounded-full shadow-[0_0_15px_rgba(223,255,0,0.5)]"></div>
    <span className="text-2xl font-black tracking-tighter text-brand-text relative z-10">Div</span>
  </div>
);

function NavSidebar({ user, handleLogout, closeMobileMenu }) {
  const location = useLocation();
  
  return (
    <aside className="w-full lg:w-64 bg-brand-surface border-r border-brand-border flex flex-col h-full transition-colors duration-300">
      <div className="p-6 flex items-center justify-between">
        <Logo />
        <button 
          onClick={closeMobileMenu}
          className="lg:hidden p-2 text-gray-500 hover:text-brand-orange transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>
      </div>

      <div className="px-4 mb-2">
        <div className="flex items-center gap-3 p-3 bg-brand-card rounded-2xl border border-brand-border">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center font-black text-brand-orange shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[11px] font-black text-brand-text truncate">{user.name}</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight truncate">{user.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <NavLink to="/" icon={<LayoutDashboard size={18} />} label="Panel" isActive={location.pathname === '/'} onClick={closeMobileMenu} />
        {user.role === Role.Admin && (
          <>
            <NavLink to="/admin/users" icon={<Users size={18} />} label="Tələbələr" isActive={location.pathname === '/admin/users'} onClick={closeMobileMenu} />
            <NavLink to="/admin/teachers" icon={<Briefcase size={18} />} label="Müəllimlər" isActive={location.pathname === '/admin/teachers'} onClick={closeMobileMenu} />
            <NavLink to="/admin/mentors" icon={<Zap size={18} />} label="Mentorlar" isActive={location.pathname === '/admin/mentors'} onClick={closeMobileMenu} />
            <NavLink to="/admin/groups" icon={<BookOpen size={18} />} label="Qruplar" isActive={location.pathname === '/admin/groups'} onClick={closeMobileMenu} />
            <NavLink to="/admin/accounts" icon={<ShieldCheck size={18} />} label="Hesablar" isActive={location.pathname === '/admin/accounts'} onClick={closeMobileMenu} />
            <NavLink to="/admin/logs" icon={<History size={18} />} label="Aktivlik" isActive={location.pathname === '/admin/logs'} onClick={closeMobileMenu} />
            <NavLink to="/admin/trash" icon={<Trash2 size={18} />} label="Zibil Qutusu" isActive={location.pathname === '/admin/trash'} onClick={closeMobileMenu} />
          </>
        )}
      </div>
    </aside>
  );
}

function MainLayout({ user, handleLogout }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('az-AZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('az-AZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-screen w-full bg-brand-dark text-[#E2E2E2] flex font-sans overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar Container */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:translate-x-0 w-64
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <NavSidebar user={user} handleLogout={handleLogout} closeMobileMenu={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
          {/* Header */}
          <header className="h-16 border-b border-brand-border flex items-center justify-between px-4 lg:px-8 bg-brand-surface shrink-0 z-30">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-brand-orange transition-colors shrink-0 cursor-pointer"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xs font-black uppercase tracking-tighter text-gray-500 truncate hidden xl:block">
                Sistem / <span className="text-brand-text">{user.role}</span>
              </h1>
            </div>

            {/* Center Clock & Date */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none">
               <div className="flex flex-col items-center">
                  <span className="text-[11px] lg:text-[14px] font-black tracking-[0.1em] text-brand-text leading-none">
                    {formatTime(time)}
                  </span>
                  <span className="text-[6px] lg:text-[8px] font-black uppercase text-gray-600 tracking-[0.15em] mt-0.5 whitespace-nowrap">
                    {formatDate(time)}
                  </span>
               </div>
            </div>

            <div className="flex-1 flex justify-end">
              <div className="bg-brand-orange/10 text-brand-orange text-[8px] lg:text-[9px] font-black px-2.5 py-1.5 rounded-full border border-brand-orange/20 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-brand-orange animate-pulse"></div>
                <span className="hidden xs:inline">{user.role}</span> ONLINE
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-[#0A0A0C] scroll-smooth custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 lg:p-8 max-w-7xl mx-auto w-full"
              >
                <Routes>
                  <Route path="/" element={
                    user.role === Role.Admin ? <AdminDashboard /> :
                    user.role === Role.Teacher ? <TeacherDashboard /> :
                    user.role === Role.Mentor ? <TeacherDashboard /> : 
                    <StudentDashboard />
                  } />
                  <Route path="/admin/users" element={<AdminDashboard />} />
                  <Route path="/admin/teachers" element={<AdminDashboard />} />
                  <Route path="/admin/mentors" element={<AdminDashboard />} />
                  <Route path="/admin/groups" element={<AdminDashboard />} />
                  <Route path="/admin/team" element={<AdminsList />} />
                  <Route path="/admin/accounts" element={<AccountsManagement />} />
                  <Route path="/admin/logs" element={<ActivityLog />} />
                  <Route path="/admin/trash" element={<TrashBin />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
  );
}

export default function App() {
  const [user, setUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(AuthService.getCurrentUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogin = (newUser) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
  };

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <MainLayout user={user} handleLogout={handleLogout} />
    </BrowserRouter>
  );
}

function NavLink({ to, icon, label, isActive, onClick }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-[#1E1E21] text-brand-orange shadow-sm border border-[#2C2C30]' 
          : 'text-gray-400 hover:bg-[#1A1A1D] hover:text-brand-orange'
      }`}
    >
      <span className={isActive ? 'text-brand-orange' : 'text-gray-500 group-hover:text-brand-orange'}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
