import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { api, getToken, setToken } from './api';
import AuthModal from './components/AuthModal';
import CalendarOverviewModal from './components/CalendarOverviewModal';
import Header from './components/Header';
import MemoGrid from './components/MemoGrid';
import MemoModal from './components/MemoModal';
import SearchBar from './components/SearchBar';

function App() {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [memos, setMemos] = useState([]);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [memoModal, setMemoModal] = useState({ open: false, mode: 'create', memo: null });
  const [calOpen, setCalOpen] = useState(false);
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
    <div className="app-shell">
      <Header
        user={user}
        onLoginClick={(mode) => {
          setAuthMode(mode);
          setAuthOpen(true);
        }}
        onLogout={logout}
        onCalendarClick={() => setCalOpen(true)}
      />

      <main className="main-area">
        {!user && (
          <p className="muted center-pad">
            로그인하면 메모를 작성할 수 있습니다. 우측 상단에서 로그인 또는 회원가입을 해 주세요.
          </p>
        )}

        {user && (
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

      <CalendarOverviewModal open={calOpen} memos={memos} onClose={() => setCalOpen(false)} />
    </div>
  );
}

export default App;
