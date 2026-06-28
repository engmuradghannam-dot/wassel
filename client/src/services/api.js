import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://srv-d8u2t9beo5us73c1m8g0.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
