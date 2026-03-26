import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { api, getToken, setToken } from './api';
import AuthModal from './components/AuthModal';
import CalendarPage from './components/CalendarPage';
import Header from './components/Header';
import MemoGrid from './components/MemoGrid';
import MemoModal from './components/MemoModal';
import SearchBar from './components/SearchBar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [memos, setMemos] = useState([]);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [memoModal, setMemoModal] = useState({ open: false, mode: 'create', memo: null });
  const [booting, setBooting] = useState(true);

  const loadMemos = useCallback(async () => {
    if (!getToken()) {
      setMemos([]);
      return;
    }
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (tag) params.set('tag', tag);
    const qs = params.toString();
    const data = await api(`/api/memos${qs ? `?${qs}` : ''}`);
    setMemos(data.memos || []);
  }, [q, tag]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = getToken();
      if (!t) {
        setUser(null);
        setBooting(false);
        return;
      }
      try {
        const data = await api('/api/auth/me');
        if (!cancelled) setUser(data.user);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    loadMemos().catch(() => setMemos([]));
  }, [user, loadMemos]);

  const logout = () => {
    setToken(null);
    setUser(null);
    setMemos([]);
  };

  const openNewMemo = () => {
    setMemoModal({ open: true, mode: 'create', memo: null });
  };

  const openEditMemo = (memo) => {
    setMemoModal({ open: true, mode: 'edit', memo });
  };

  if (booting) {
    return (
      <div className="app-shell">
        <p className="muted center-pad">불러오는 중…</p>
      </div>
    );
  }

  return (
      // 전체를 BrowserRouter로 감싸줍니다.
      <BrowserRouter>
        <div className="app-shell">
          {/* Header는 항상 위에 고정 */}
          <Header
              user={user}
              onLoginClick={(mode) => {
                setAuthMode(mode);
                setAuthOpen(true);
              }}
              onLogout={logout}
              // Header 내부의 버튼은 클릭 이벤트 대신 <Link to="/calendar">를 사용하도록 Header.js를 수정해야 합니다.
          />

          {/* 주소에 따라 바뀌는 영역 */}
          <Routes>
            {/* 1. 기본 주소 (메인 메모장 화면) */}
            <Route path="/" element={
              <main className="main-area">
                {!user ? (
                    <p className="muted center-pad">
                      로그인하면 메모를 작성할 수 있습니다. 우측 상단에서 로그인 또는 회원가입을 해 주세요.
                    </p>
                ) : (
                    <>
                      <SearchBar
                          q={q}
                          tag={tag}
                          onQChange={setQ}
                          onTagChange={setTag}
                          disabled={false}
                      />
                      <MemoGrid memos={memos} onAdd={openNewMemo} onOpenMemo={openEditMemo} />
                    </>
                )}
              </main>
            } />

            {/* 2. 달력 주소 (전체 화면으로 캘린더 띄우기) */}
            <Route path="/calendar" element={
              <main className="main-area">
                <CalendarPage memos={memos} />
              </main>
            } />
          </Routes>

          {/* 모달들은 화면 위에 뜨는 거라 그대로 둡니다 */}
          <AuthModal
              open={authOpen}
              initialMode={authMode}
              onClose={() => setAuthOpen(false)}
              onLoggedIn={(u) => {
                setUser(u);
                setAuthOpen(false);
              }}
          />

          <MemoModal
              open={memoModal.open}
              mode={memoModal.mode}
              initialMemo={memoModal.memo}
              onClose={() => setMemoModal((s) => ({ ...s, open: false }))}
              onSaved={() => loadMemos()}
              onDeleted={() => loadMemos()}
          />
        </div>
      </BrowserRouter>
  );
}

export default App;
