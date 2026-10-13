import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const csrfToken = localStorage.getItem('designforge_csrf');
  if (csrfToken && ['post', 'patch', 'put', 'delete'].includes((config.method || '').toLowerCase())) {
    const headers = config.headers ?? {};
    (headers as Record<string, string>)[`X-CSRF-Token`] = csrfToken;
    config.headers = headers as typeof config.headers;
  }
  return config;
});

export async function fetchCsrfToken() {
  const { data } = await api.get('/auth/csrf');
  const token = data?.csrfToken || '';
  if (token) {
    localStorage.setItem('designforge_csrf', token);
  }
  return token;
}
