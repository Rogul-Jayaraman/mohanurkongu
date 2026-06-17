import axios from 'axios';
import { AppError } from './errors';

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
      throw new AppError(
        response.status,
        body.error?.code || 'UNKNOWN_ERROR',
        body.error?.message || 'Request failed',
      );
    }
    return body;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new AppError(0, 'NETWORK_ERROR', 'Request timed out');
    }
    throw error;
  },
);
