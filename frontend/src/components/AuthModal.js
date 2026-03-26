import { useEffect, useState } from 'react';
import { api, setToken } from '../api';

export default function AuthModal({ open, initialMode = 'login', onClose, onLoggedIn }) {
  const [mode, setMode] = useState(initialMode);
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const data = await api(path, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(data.token);
      onLoggedIn(data.user);
      onClose();
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.data?.error || err.message || '오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal auth-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
        <form onSubmit={submit}>
          <label>
            아이디
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              닫기
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? '처리 중…' : mode === 'login' ? '로그인' : '가입'}
            </button>
          </div>
        </form>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? '회원가입' : '로그인으로'}
        </button>
      </div>
    </div>
  );
}
