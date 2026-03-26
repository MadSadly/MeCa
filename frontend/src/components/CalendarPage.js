import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import dayjs from 'dayjs';
import 'react-calendar/dist/Calendar.css';
import './CalendarPage.css'; // 전용 스타일 파일

export default function CalendarPage({ memos, onOpenMemo, onAddMemo }) {
  const [value, setValue] = useState(new Date());

  // 1. 메모 데이터를 날짜별로 그룹화 (기존 로직 유지)
    const byDate = useMemo(() => {
        const map = new Map();
        (memos || []).forEach((m) => {
            if (!m.due_date) return;
            const key = dayjs(m.due_date).format('YYYY-MM-DD');
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(m);
        });
        return map;
    }, [memos]);

  const selectedKey = dayjs(value).format('YYYY-MM-DD');
  const dayMemos = byDate.get(selectedKey) || [];

    return (
        <div className="calendar-page-container">
            <div className="calendar-header">
                <h2>일정 캘린더</h2>
                <p className="muted">{memos.length}개의 메모가 연결되어 있습니다.</p>
            </div>

            <div className="calendar-main-content">
                <div className="calendar-section">
                    <Calendar
                        value={value}
                        onChange={setValue}
                        formatDay={(locale, date) => dayjs(date).format('D')}
                        tileContent={({ date, view }) => {
                            if (view !== 'month') return null;
                            const k = dayjs(date).format('YYYY-MM-DD');
                            const n = byDate.get(k)?.length || 0;
                            return n ? (
                                <div className="dot-container">
                                    {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
                                        <span key={i} className="cal-dot"></span>
                                    ))}
                                </div>
                            ) : null;
                        }}
                    />
                </div>

                {/* 오른쪽: 선택한 날짜의 메모 리스트 */}
                <div className="calendar-day-list-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className="selected-date-title" style={{ margin: 0 }}>
                            {dayjs(value).format('YYYY년 MM월 DD일')}
                        </h3>
                        {/* ✅ 여기에 추가 버튼을 다시 살려냈습니다! */}
                        <button
                            className="btn primary small"
                            onClick={() => onAddMemo(value)}
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                            + 메모 추가
                        </button>
                    </div>

                    {dayMemos.length === 0 ? (
                        <div className="empty-state">
                            <p className="muted">이날은 등록된 메모가 없어요.</p>
                        </div>
                    ) : (
                        <ul className="memo-items-list">
                            {dayMemos.map((m) => (
                                <li key={m.id} className="memo-item-card" onClick={() => onOpenMemo(m)} style={{ cursor: 'pointer' }}>
                                    <div className="memo-item-content">
                                        <strong className="memo-title">{m.title || '(제목 없음)'}</strong>
                                        <p className="memo-body-preview">
                                            {m.body ? m.body.slice(0, 100) : '내용이 없습니다.'}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}