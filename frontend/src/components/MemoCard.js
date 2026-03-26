import dayjs from 'dayjs';

export default function MemoCard({ memo, onClick }) {
  const title = memo.title?.trim() || '(제목 없음)';
  const body = memo.body?.trim() || '';
  const dateLabel = memo.updated_at
    ? dayjs(memo.updated_at).format('YYYY.MM.DD HH:mm')
    : '';

  return (
    <button type="button" className="memo-card" onClick={() => onClick(memo)}>
      <div className="memo-card-title">{title}</div>
      <div className="memo-card-body">{body}</div>
      {dateLabel && <div className="memo-card-meta">{dateLabel}</div>}
      {memo.tags?.length > 0 && (
        <div className="memo-card-tags">
          {memo.tags.map((t) => (
            <span key={t} className="tag-pill">
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
