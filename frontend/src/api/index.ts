import axios from 'axios';

// 开发环境走 Vite proxy (/api → localhost:3000)
// 同机 Nginx 部署也走 /api → Nginx proxy
// 前后端分离部署时设置环境变量 VITE_API_BASE_URL=https://api.nexious-api.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
