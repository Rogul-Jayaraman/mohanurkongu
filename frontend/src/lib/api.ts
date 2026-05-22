import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor for normalization and error handling
api.interceptors.response.use(
  (response) => {
    // Some legacy endpoints might return { success: false, error: ... } even on 200 OK
    if (response.data && response.data.success === false) {
      return Promise.reject(response.data.error || { message: response.data.message || 'Unknown error' });
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/manamaalai/login';
    }
    
    // Normalize error according to api-documentation standards
    const normalizedError = {
      code: error.response?.data?.error?.code || 'ERR_UNKNOWN',
      message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred',
      fieldErrors: error.response?.data?.error?.fieldErrors,
      status: error.response?.status
    };
    
    return Promise.reject(normalizedError);
  }
);

export default api;
