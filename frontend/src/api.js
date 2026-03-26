const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const TOKEN_KEY = 'memo_app_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const base = API_BASE || '';
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || '응답 파싱 오류' };
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || '요청 실패');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { API_BASE };
