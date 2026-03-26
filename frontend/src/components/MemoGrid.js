import MemoCard from './MemoCard';

export default function MemoGrid({ memos, onAdd, onOpenMemo }) {
  return (
    <div className="memo-grid">
      <button type="button" className="add-tile" onClick={onAdd}>
        <span className="add-tile-plus">+</span>
        <span>메모 추가</span>
      </button>
      {memos.map((m) => (
        <MemoCard key={m.id} memo={m} onClick={onOpenMemo} />
      ))}
    </div>
  );
}
