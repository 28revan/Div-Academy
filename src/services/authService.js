const API_BASE = '/api';

export const AuthService = {
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      const snippet = text.substring(0, 100).replace(/<[^>]*>/g, '').trim();
      console.error('Non-JSON response from server:', text);
      throw new Error(`Server JSON cavabı qaytarmadı. Cavab başlığı: "${snippet}...". API marşrutu düzgün qurulmayıb və ya serverdə xəta baş verib.`);
    }
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  updateCurrentUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }
};
