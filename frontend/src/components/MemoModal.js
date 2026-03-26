import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import dayjs from 'dayjs';
import { api } from '../api';
import 'react-calendar/dist/Calendar.css';

const PRESET_TAGS = ['일정', '회의', '업무', '개인', '아이디어', '중요'];

function toggleTag(tags, t) {
  const set = new Set(tags);
  if (set.has(t)) set.delete(t);
  else set.add(t);
  return Array.from(set);
}

export default function MemoModal({
  open,
  mode,
  initialMemo,
  onClose,
  onSaved,
  onDeleted,
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [dueDate, setDueDate] = useState(null);
  const [calOpen, setCalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sumLoading, setSumLoading] = useState(false);
  const [error, setError] = useState('');

  const memoId = initialMemo?.id;

  useEffect(() => {
    if (!open) return;
    setError('');
    if (mode === 'edit' && initialMemo) {
      setTitle(initialMemo.title || '');
      setBody(initialMemo.body || '');
      setTags(initialMemo.tags || []);
      setDueDate(initialMemo.due_date || null);
    } else {
      setTitle('');
      setBody('');
      setTags([]);
      setDueDate(null);
    }
  }, [open, mode, initialMemo]);

  if (!open) return null;

  const hasMeaningfulContent = () =>
    Boolean(
      title.trim() ||
        body.trim() ||
        (tags && tags.length > 0) ||
        dueDate
    );

  const persist = async () => {
    setError('');
    if (mode === 'create' && !hasMeaningfulContent()) {
      return;
    }
    const payload = {
      title: title.trim(),
      body: body.trim(),
      tags,
      due_date: dueDate || null,
    };
    setSaving(true);
    try {
      if (mode === 'create') {
        const data = await api('/api/memos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        onSaved?.(data.memo);
      } else if (memoId) {
        const data = await api(`/api/memos/${memoId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        onSaved?.(data.memo);
      }
    } catch (e) {
      setError(e.data?.error || e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleBackdrop = async (e) => {
    if (e.target !== e.currentTarget) return;
    try {
      if (mode === 'create' && !hasMeaningfulContent()) {
        onClose();
        return;
      }
      await persist();
    } catch {
      return;
    }
    onClose();
  };

  const handleSaveClick = async () => {
    if (mode === 'create' && !hasMeaningfulContent()) {
      setError('제목·내용·태그·일정 중 하나 이상 입력해 주세요.');
      return;
    }
    try {
      await persist();
      onClose();
    } catch {
      /* error shown */
    }
  };

  const handleSummarize = async () => {
    if (!memoId) return;
    setSumLoading(true);
    setError('');
    try {
      await persist();
      const data = await api(`/api/memos/${memoId}/summarize`, { method: 'POST' });
      onSaved?.(data.memo);
      onClose();
    } catch (e) {
      setError(e.data?.error || e.message);
    } finally {
      setSumLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!memoId) return;
    if (!window.confirm('이 메모를 삭제할까요?')) return;
    setSaving(true);
    setError('');
    try {
      await api(`/api/memos/${memoId}`, { method: 'DELETE' });
      onDeleted?.();
      onClose();
    } catch (e) {
      setError(e.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  const calValue = dueDate ? new Date(dueDate + 'T12:00:00') : new Date();

  return (
    <>
      <div className="modal-backdrop" role="presentation" onMouseDown={handleBackdrop}>
        <div className="modal memo-modal" onMouseDown={(e) => e.stopPropagation()}>
          <h2 className="memo-modal-title">{mode === 'create' ? '새 메모' : '메모 수정'}</h2>

          <div className="field-group">
            <span className="label">태그</span>
            <div className="tag-chips">
              {PRESET_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tag-chip ${tags.includes(t) ? 'on' : ''}`}
                  onClick={() => setTags(toggleTag(tags, t))}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="field-block">
            제목
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
          </label>

          <label className="field-block">
            내용
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="메모 내용"
              rows={8}
            />
          </label>

          <div className="due-row">
            <span className="label">일정</span>
            <button type="button" className="btn outline" onClick={() => setCalOpen(true)}>
              {dueDate ? dayjs(dueDate).format('YYYY년 MM월 DD일') : '캘린더에서 날짜 선택'}
            </button>
            {dueDate && (
              <button type="button" className="link-btn" onClick={() => setDueDate(null)}>
                일정 지우기
              </button>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            {mode === 'edit' && memoId && (
              <button
                type="button"
                className="btn accent"
                onClick={handleSummarize}
                disabled={sumLoading || saving}
              >
                {sumLoading ? '요약 중…' : '요약 (새 메모)'}
              </button>
            )}
            {mode === 'edit' && memoId && (
              <button type="button" className="btn danger" onClick={handleDelete} disabled={saving}>
                삭제
              </button>
            )}
            <button type="button" className="btn ghost" onClick={onClose}>
              취소
            </button>
            <button type="button" className="btn primary" onClick={handleSaveClick} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {calOpen && (
        <div
          className="modal-backdrop nested"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCalOpen(false);
          }}
        >
          <div className="modal cal-picker-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>날짜 선택</h3>
            <Calendar
              value={calValue}
              onChange={(d) => {
                if (d instanceof Date) {
                  setDueDate(dayjs(d).format('YYYY-MM-DD'));
                  setCalOpen(false);
                }
              }}
            />
            <button type="button" className="btn primary" onClick={() => setCalOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
