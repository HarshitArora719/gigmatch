import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // For httpOnly cookies
});

// Attach Authorization header if token exists in localStorage (cross-domain backup)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gm_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      const url = error.config?.url || '';
      if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
        localStorage.removeItem('gm_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;