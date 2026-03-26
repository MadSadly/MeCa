export default function Header({
  user,
  onLoginClick,
  onLogout,
  onCalendarClick,
}) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-icon" aria-hidden>
            ☰
          </span>
          <h1>Keep 메모</h1>
        </div>
        <div className="header-actions">
          {user && (
            <button type="button" className="btn ghost" onClick={onCalendarClick}>
              캘린더
            </button>
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
              <button type="button" className="btn ghost" onClick={() => onLoginClick('login')}>
                로그인
              </button>
              <button type="button" className="btn primary" onClick={() => onLoginClick('register')}>
                회원가입
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
