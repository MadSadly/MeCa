import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import dayjs from 'dayjs';
import 'react-calendar/dist/Calendar.css';

export default function CalendarPage({ open, memos, onClose }) {
  const [value, setValue] = useState(new Date());

  const byDate = useMemo(() => {
    const map = new Map();
    (memos || []).forEach((m) => {
      if (!m.due_date) return;
      const key = m.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return map;
  }, [memos]);

  if (!open) return null;

  const key = dayjs(value).format('YYYY-MM-DD');
  const dayMemos = byDate.get(key) || [];

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal calendar-overview-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="calendar-overview-head">
          <h2>캘린더</h2>
          <button type="button" className="btn ghost" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="calendar-overview-body">
          <Calendar
            value={value}
            onChange={setValue}
            tileContent={({ date, view }) => {
              if (view !== 'month') return null;
              const k = dayjs(date).format('YYYY-MM-DD');
              const n = byDate.get(k)?.length || 0;
              return n ? <span className="cal-dot">{n}</span> : null;
            }}
          />
          <div className="calendar-day-list">
            <h3>{key} 일정</h3>
            {dayMemos.length === 0 && <p className="muted">해당 날짜에 메모가 없습니다.</p>}
            <ul>
              {dayMemos.map((m) => (
                <li key={m.id}>
                  <strong>{m.title || '(제목 없음)'}</strong>
                  {m.body && <span className="muted"> — {m.body.slice(0, 60)}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
