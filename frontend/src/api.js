// REACT_APP_API_URL 비우면 → 같은 출처(/api) + package.json proxy → Flask. 세션 쿠키 전달에 필요.
// 기본을 http://localhost:5000 으로 두면 3000→5000 이 cross-site 가 되어 SameSite=Lax 쿠키가 fetch에 안 붙음.
const raw = process.env.REACT_APP_API_URL;
const API_BASE =
  raw !== undefined && raw !== null && String(raw).trim() !== ''
    ? String(raw).replace(/\/$/, '')
    : '';

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
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
