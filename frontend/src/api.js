// REACT_APP_API_URL 비우면 같은 출처(/api → package.json proxy → Flask)로 가서 세션 쿠키 전달됨
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

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
