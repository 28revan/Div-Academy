import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { AuthService } from '../services/authService';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await AuthService.login(email, password);
      onLogin(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Giriş uğursuz oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C] p-4 font-sans text-[#E2E2E2]">
      <div className="w-full max-w-md">
        <div className="bg-[#161619] p-10 rounded-3xl border border-[#242427] shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-orange/10 blur-3xl rounded-full"></div>
          
          <div className="relative z-10">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="relative inline-block">
                  <div className="absolute -top-2 -left-3 w-6 h-6 bg-brand-orange rounded-full shadow-[0_0_20px_rgba(223,255,0,0.7)]"></div>
                  <span className="text-5xl font-black tracking-tighter text-[#E2E2E2] relative z-10">Div</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Xoş gəlmisiniz</h1>
              <p className="text-gray-500 text-sm mt-2 font-medium">LMS Pro sisteminə giriş edin</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-100 bg-red-600 rounded-xl border border-red-500 shadow-lg shadow-red-600/20">
                  <AlertCircle size={14} />
                  <span className="break-all">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">E-poçt</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#1E1E21] border border-[#2C2C30] text-[#E2E2E2] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all text-sm"
                    placeholder="revaneliyev133@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1 mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Şifrə</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#1E1E21] border border-[#2C2C30] text-[#E2E2E2] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all text-sm"
                    placeholder="revan28@!"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-brand-orange text-brand-dark rounded-xl font-black hover:bg-opacity-90 transition-all shadow-lg shadow-brand-orange/20 active:scale-[0.98] mt-4 uppercase tracking-widest text-xs"
              >
                {loading ? 'Giriş edilir...' : 'Daxil ol'}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-[#242427] text-center">
              <p className="text-[10px] text-gray-600 font-mono tracking-tighter">
                SECURE AUTH GATEWAY v2.0
              </p>
              <p className="text-[10px] text-gray-700 font-mono mt-1">
                Admin: revaneliyev133@gmail.com / revan28@!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
