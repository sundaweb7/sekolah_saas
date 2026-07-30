import axios from 'axios';
import { getTenantHeader } from '../utils/tenant';

// Strip subdomain to get the backend base host
// e.g. tkmelati.localhost → localhost, sub.paudku.id → paudku.id
function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window === 'undefined') return 'http://localhost:8080/api/v1';
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const lastPart = parts[parts.length - 1];
  // If TLD is 'localhost' or plain host, always use localhost:8080
  if (lastPart === 'localhost' || lastPart === '127' || parts.length === 1) {
    return 'http://localhost:8080/api/v1';
  }
  // Production: strip subdomain → keep last 2 parts, but support .my.id (3 parts)
  let baseHost;
  if (hostname.endsWith('.my.id')) {
    baseHost = parts.slice(-3).join('.');
  } else {
    baseHost = parts.slice(-2).join('.');
  }
  const protocol = window.location.protocol;
  return `${protocol}//${baseHost}/api/v1`;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Token & Tenant school_id
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Use the URL tenant, never a stale tenant ID from browser storage.
    if (!config.headers['X-School-ID']) {
      const tenant = getTenantHeader();
      if (tenant) config.headers['X-School-ID'] = tenant;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Session expired
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('school_id');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('school_id');
      window.location.href = '/login';
    }

    const message = error.response?.data?.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
