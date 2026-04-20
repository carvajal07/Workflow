import axios, { AxiosError, type AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const tokenKey = import.meta.env.VITE_TOKEN_STORAGE_KEY ?? 'pdfsketch_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(tokenKey);
  } catch {
    return null;
  }
}
export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(tokenKey, token);
    else localStorage.removeItem(tokenKey);
  } catch {
    /* noop */
  }
}

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    // 401 => token inválido o expirado
    if (error.response?.status === 401) {
      setToken(null);
      // TODO: redirigir a login cuando exista esa ruta
    }
    return Promise.reject(error);
  },
);
