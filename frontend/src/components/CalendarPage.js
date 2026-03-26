import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import dayjs from 'dayjs';
import 'react-calendar/dist/Calendar.css';
import './CalendarPage.css';

export default function CalendarPage({ memos, onOpenMemo, onAddMemo }) {
    const [value, setValue] = useState(new Date());

    const byDate = useMemo(() => {
        const map = new Map();
        if (!memos) return map;

        memos.forEach((m) => {
            if (!m.due_date) return;
            const dateKey = dayjs(m.due_date).format('YYYY-MM-DD');
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey).push(m);
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
                {/* 왼쪽: 달력 영역 */}
                <div className="calendar-section">
                    <Calendar
                        value={value}
                        onChange={setValue}
                        formatDay={(locale, date) => dayjs(date).format('D')}
                        tileContent={({ date, view }) => {
                            if (view !== 'month') return null;

                            // ✅ 변수 오타 수정 완료!
                            const k = dayjs(date).format('YYYY-MM-DD');
                            const dayData = byDate.get(k);

                            if (dayData && dayData.length > 0) {
                                return (
                                    <div className="dot-container">
                                        <span className="cal-dot"></span>
                                        {dayData.length > 1 && <span className="cal-count">{dayData.length}</span>}
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </div>

                {/* 오른쪽: 선택한 날짜의 메모 리스트 */}
                <div className="calendar-day-list-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 className="selected-date-title" style={{ margin: 0 }}>
                            {dayjs(value).format('YYYY년 MM월 DD일')}
                        </h3>
                        {/* ➕ 메모 추가 버튼을 제목 옆으로 배치 */}
                        <button
                            className="btn primary small"
                            onClick={() => onAddMemo(value)}
                        >
                            + 추가
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
                                        {m.tags && m.tags.length > 0 && (
                                            <div className="memo-tags">
                                                {m.tags.map(tag => <span key={tag} className="tag-badge" key={tag}>#{tag}</span>)}
                                            </div>
                                        )}
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