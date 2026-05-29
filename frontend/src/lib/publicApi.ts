import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const publicApi = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

publicApi.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body?.success === true) return body.data;
    if (body?.success === false) {
      throw Object.assign(new Error(body.error?.message || 'Request failed'), {
        code: body.error?.code || 'UNKNOWN_ERROR',
        status: response.status,
      });
    }
    return body;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out');
    }
    throw error;
  },
);
