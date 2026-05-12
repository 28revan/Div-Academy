import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import api from './api';

export const AuthService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      // LocalStorage-da yalnız userin ümumi məlumatları saxlanılır, token artıq cookiedədir.
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Giriş xətası baş verdi.');
    }
  },

  async logout() {
    try {
      await signOut(auth);
    } catch(e) {
      console.error("Firebase logout error", e);
    }
    // Gələcəkdə Serverə /logout axını əlavə edib cookie-ni də poza bilərsiniz
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Token artıq HttpOnly cookiedə olduğu üçün bu funksiyaya ehtiyac yoxdur, amma uyğunluq üçün null qaytarırıq.
  getToken() {
    return null;
  },

  updateCurrentUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }
};
