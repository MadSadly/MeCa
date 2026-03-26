import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AuthModal({ open, initialMode = 'login', onClose, onLoggedIn }) {
  const [mode, setMode] = useState(initialMode);
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== passwordConfirm) {
      window.alert('비밀번호가 일치하지 않습니다.');
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { username, password }
          : { username, password, full_name: fullName, email, phone };
      const data = await api(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (mode === 'login') {
        onLoggedIn(data.user);
        onClose();
        setUsername('');
        setPassword('');
      } else {
        window.alert('회원가입이 완료되었습니다. 로그인해 주세요.');
        setMode('login');
        // 아이디는 유지해서 로그인 편하게, 비밀번호/추가정보만 초기화
        setPassword('');
        setPasswordConfirm('');
        setFullName('');
        setEmail('');
        setPhone('');
      }
    } catch (err) {
      setError(err.data?.error || err.message || '오류');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setPasswordConfirm('');
    setFullName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal auth-modal stitch-auth-modal ${mode === 'register' ? 'register-mode' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <section className="auth-visual">
          <img
            src={mode === 'login' ? '/auth-login-banner.png' : '/auth-register-banner.png'}
            alt="MEMOS banner"
          />
          <div className="auth-visual-overlay" />
        </section>
        <section className="auth-form-area">
          <div className="auth-form-head">
            <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
            <p>
              {mode === 'login'
                ? '당신의 메모와 일정을 확인하세요.'
                : '새 계정을 만들어 메모를 시작하세요.'}
            </p>
          </div>
          <form onSubmit={submit} className="auth-form">
            <label className="auth-field">
              <span>아이디</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="아이디 입력"
                required
              />
            </label>
            <label className="auth-field">
              <span>비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="비밀번호 입력"
                required
              />
            </label>
            {mode === 'register' && (
              <>
                <label className="auth-field">
                  <span>비밀번호 확인</span>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    placeholder="비밀번호 다시 입력"
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>성명</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    placeholder="이름 입력"
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>이메일 주소</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="이메일 주소 입력"
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>전화번호</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="전화번호 입력"
                    required
                  />
                </label>
              </>
            )}
            {error && <p className="form-error">{error}</p>}
            <div className="auth-actions">
              {mode === 'register' && (
                <button type="button" className="btn ghost auth-cancel-btn" onClick={onClose}>
                  취소
                </button>
              )}
              <button type="submit" className="btn primary auth-submit-btn" disabled={loading}>
                {loading ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
              </button>
            </div>
          </form>
          {mode === 'login' && (
            <>
              <div className="auth-divider">또는</div>
              <button
                type="button"
                className="btn auth-secondary-btn"
                onClick={switchMode}
              >
                회원가입
              </button>
              <button type="button" className="auth-close-text" onClick={onClose}>
                닫기
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
