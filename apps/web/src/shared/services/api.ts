import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null): void {
  refreshHandler = handler;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry && refreshHandler) {
      original._retry = true;
      refreshing ??= refreshHandler().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
