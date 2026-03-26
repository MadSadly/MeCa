import { Link } from 'react-router-dom';

export default function Header({
  user,
  onLoginClick,
  onLogout,
}) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>MEMOS</h1>
          </Link>
        </div>

        <div className="header-actions">
          {user && (
              <Link to="/calendar" className="btn ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                캘린더
              </Link>
          )}
          {user ? (
            <>
              <span className="user-greet">{user.username}님</span>
              <button type="button" className="btn outline" onClick={onLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn ghost auth-login-btn"
                onClick={() => onLoginClick('login')}
              >
                로그인
              </button>
              <button
                type="button"
                className="btn primary auth-signup-btn"
                onClick={() => onLoginClick('register')}
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
