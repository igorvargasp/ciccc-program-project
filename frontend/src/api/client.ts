import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AUTH_EXPIRED_EVENT, fetchAuthJwt } from '../auth';
import { useAppStore } from '../store/app';

/**
 * Origin of the backend. Left empty in dev so requests stay same-origin and go
 * through the Vite proxy (see vite.config.ts); set it for a production build.
 */
export const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  ''
).replace(/\/$/, '');

const BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

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

/**
 * Neon Auth JWTs are short-lived, so a tab left open outlives its token. On a
 * 401 we mint a fresh one from the still-valid session cookie and retry once;
 * concurrent 401s share a single refresh.
 */
let refreshing: Promise<string | null> | null = null;

function refreshToken(): Promise<string | null> {
  refreshing ??= fetchAuthJwt()
    .catch(() => null)
    .then((token) => {
      useAppStore.getState().setToken(token);
      if (!token) window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      return token;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as
    | (InternalAxiosRequestConfig & { _retried?: boolean })
    | undefined;

  if (error.response?.status !== 401 || !config || config._retried) {
    throw error;
  }

  config._retried = true;

  const token = await refreshToken();
  if (!token) throw error;

  config.headers.Authorization = `Bearer ${token}`;
  return apiClient.request(config);
});
