import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFirebaseLogin = async (userCredential) => {
    const user = userCredential.user;
    
    // Check if user exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    let userData;
    if (userSnap.exists()) {
      userData = userSnap.data();
    } else {
      // Determine if admin
      const isAdmin = user.email === 'revaneliyev133@gmail.com';
      
      userData = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        role: isAdmin ? 'Admin' : 'Student',
        createdAt: new Date().toISOString()
      };
      
      try {
        await setDoc(userRef, userData);
      } catch (e) {
        console.error("Firestore Error creating user:", e);
      }
    }

    localStorage.setItem('user', JSON.stringify(userData));
    onLogin(userData);
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleFirebaseLogin(userCredential);
    } catch (err) {
      // Auto-signup fallback for easy registration
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await handleFirebaseLogin(userCredential);
        } catch (signupErr) {
          if (signupErr.code === 'auth/email-already-in-use') {
            setError('Bu e-poçt artıq mövcuddur, lakin şifrə yanlışdır. Zəhmət olmasa Google ilə daxil olun və ya şifrəni yeniləyin.');
          } else if (signupErr.code === 'auth/operation-not-allowed') {
            setError('Firebase Konsolunda Email/Password girişi aktiv edilməlidir!');
          } else {
            setError(signupErr.message || 'Giriş uğursuz oldu');
          }
        }
      } else {
        if (err.code === 'auth/operation-not-allowed') {
          setError('Təhlükəsizlik üçün Firebase Konsolunda (Authentication) Email/Password girişi aktiv edilməlidir!');
        } else {
          setError(err.message || 'Giriş uğursuz oldu');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await handleFirebaseLogin(userCredential);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google ilə giriş uğursuz oldu');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Zəhmət olmasa şifrəni sıfırlamaq üçün e-poçt ünvanınızı daxil edin.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Şifrəni yeniləmək üçün e-poçtunuza link göndərildi! Zəhmət olmasa yoxlayın.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Şifrə sıfırlama uğursuz oldu.');
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
                  <button 
                    type="button" 
                    onClick={handleResetPassword}
                    className="text-[10px] text-brand-orange hover:text-brand-orange/80 transition-colors font-medium font-mono"
                  >
                    Şifrəni unutmusunuz?
                  </button>
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
              
              <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#2C2C30]"></div>
                  </div>
                  <div className="relative bg-[#161619] px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Və ya
                  </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 px-4 bg-white text-black rounded-xl font-black hover:bg-gray-100 transition-all shadow-lg active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Google ilə daxil ol
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-[#242427] text-center">
              <p className="text-[10px] text-gray-600 font-mono tracking-tighter">
                SECURE AUTH GATEWAY v2.0 (Firebase)
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
