import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AppError } from './errors';
import { getAccessToken, setAccessToken, clearAccessToken } from './session';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];
let onRefreshEnd: (() => void) | null = null;

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

function setRefreshPromise(promise: Promise<void>) {
  const end = () => {
    isRefreshing = false;
    onRefreshEnd = null;
  };
  onRefreshEnd = end;
  promise.then(end, end);
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.headers) {
    config.headers['Accept-Language'] = localStorage.getItem('language') || 'en';
    const csrfToken = getCookie('csrf-token');
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body?.success === true) return body.data;
    if (body?.success === false) {
      const err = body.error || body;
      throw new AppError(
        response.status,
        err.code || 'UNKNOWN_ERROR',
        err.message || 'Request failed',
        err.details,
      );
    }
    return body;
  },
  async (error: AxiosError<{ success?: boolean; error?: { code?: string; message?: string; details?: unknown } }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.headers?.Authorization) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tryRefresh = async (): Promise<void> => {
        const resp = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        const body = resp.data;
        if (body?.success === true && body.data?.accessToken) {
          const newToken = body.data.accessToken;
          setAccessToken(newToken);
          processQueue(null, newToken);
        } else {
          throw new AppError(401, 'AUTH_TOKEN_INVALID', 'Session expired');
        }
      };

      setRefreshPromise(tryRefresh().catch((refreshErr) => {
        processQueue(refreshErr);
        clearAccessToken();
        window.location.href = '/manamaalai/login';
        throw refreshErr;
      }));

      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    const resp = error.response;
    if (resp?.data && typeof resp.data === 'object') {
      const body = resp.data as Record<string, unknown>;
      const errBody = (body.error as Record<string, unknown>) || body;
      throw new AppError(
        resp.status,
        (errBody.code as string) || 'UNKNOWN_ERROR',
        (errBody.message as string) || error.message || 'Request failed',
        errBody.details,
      );
    }

    if (error.code === 'ECONNABORTED') {
      throw new AppError(0, 'REQUEST_TIMEOUT', 'Request timed out');
    }
    if (!error.response) {
      throw new AppError(0, 'NETWORK_ERROR', 'Network error. Please check your connection.');
    }

    throw new AppError(
      error.response?.status || 0,
      'UNKNOWN_ERROR',
      error.message || 'An unexpected error occurred',
    );
  },
);

export default api;
