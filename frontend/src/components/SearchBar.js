const TAG_OPTIONS = ['', '일정', '회의', '업무', '개인', '아이디어', '중요', '요약'];

export default function SearchBar({ q, tag, onQChange, onTagChange, disabled }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="메모 검색…"
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        disabled={disabled}
        aria-label="메모 검색"
      />
      <select
        value={tag}
        onChange={(e) => onTagChange(e.target.value)}
        disabled={disabled}
        aria-label="태그 필터"
      >
        {TAG_OPTIONS.map((t) => (
          <option key={t || 'all'} value={t}>
            {t ? `태그: ${t}` : '모든 태그'}
          </option>
        ))}
      </select>
    </div>
  );
}
