import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export const apiClient = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// Attach Bearer token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sfh-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
