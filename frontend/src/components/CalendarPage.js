import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import dayjs from 'dayjs';
import 'react-calendar/dist/Calendar.css';
import './CalendarPage.css'; // 전용 스타일 파일

export default function CalendarPage({ memos }) {
  const [value, setValue] = useState(new Date());

  // 1. 메모 데이터를 날짜별로 그룹화 (기존 로직 유지)
  const byDate = useMemo(() => {
    const map = new Map();
    (memos || []).forEach((m) => {
      if (!m.due_date) return;
      // DB의 날짜 형식이 다를 수 있으니 dayjs로 통일해서 키값 생성
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
          {/* 왼쪽: 달력 영역 */}
          <div className="calendar-section">
            <Calendar
                value={value}
                onChange={setValue}
                formatDay={(locale, date) => dayjs(date).format('D')} // '일' 글자 제거
                tileContent={({ date, view }) => {
                  if (view !== 'month') return null;
                  const k = dayjs(date).format('YYYY-MM-DD');
                  const n = byDate.get(k)?.length || 0;
                  // 날짜 아래에 메모 개수만큼 점(Dot) 표시
                  return n ? (
                      <div className="dot-container">
                        {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
                            <span key={i} className="cal-dot"></span>
                        ))}
                        {n > 3 && <span className="more-dots">+</span>}
                      </div>
                  ) : null;
                }}
            />
          </div>

          {/* 오른쪽: 선택한 날짜의 메모 리스트 */}
          <div className="calendar-day-list-section">
            <h3 className="selected-date-title">
              {dayjs(value).format('YYYY년 MM월 DD일')}
            </h3>

            {dayMemos.length === 0 ? (
                <div className="empty-state">
                  <p className="muted">이날은 등록된 메모가 없어요.</p>
                </div>
            ) : (
                <ul className="memo-items-list">
                  {dayMemos.map((m) => (
                      <li key={m.id} className="memo-item-card">
                        <div className="memo-item-content">
                          <strong className="memo-title">{m.title || '(제목 없음)'}</strong>
                          <p className="memo-body-preview">
                            {m.body ? m.body.slice(0, 100) : '내용이 없습니다.'}
                          </p>
                          {m.tags && m.tags.length > 0 && (
                              <div className="memo-tags">
                                {m.tags.map(tag => <span key={tag} className="tag-badge">#{tag}</span>)}
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