import axios from 'axios';

// Axios mərkəzi konfiqurasiyası
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // HTTPOnly Cookie-ləri avtomatik göndərmək üçün
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor: Mərkəzi xəta idarəetməsi və 401 (Unauthorized) halı
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Əgər tokenin vaxtı bitibsə və ya icazə yoxdursa, avtomatik login səhifəsinə yönləndirə bilərsiniz
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        sessionStorage.removeItem('user'); // Yalnız istifadəçi məlumatları (token onsuzda cookiedədir)
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
