import { useMemo, useState } from 'react';

export default function CategoryManagerModal({
  open,
  categories,
  onClose,
  onCreate,
  onRename,
  onDelete,
}) {
  const [name, setName] = useState('');
  const sorted = useMemo(() => {
    return [...(categories || [])].sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'));
  }, [categories]);

  if (!open) return null;

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const created = await onCreate?.(trimmed);
    if (created) setName('');
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="카테고리 관리">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">카테고리 관리</h3>
          <button type="button" className="button secondary modal-close" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="modal-body">
          <div className="row" style={{ justifyContent: 'flex-start' }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="새 카테고리 이름"
              maxLength={60}
              aria-label="새 카테고리 이름"
            />
            <button type="button" className="button secondary" onClick={handleCreate}>
              추가
            </button>
          </div>

          {sorted.length === 0 ? (
            <p className="muted" style={{ marginTop: 12 }}>아직 카테고리가 없어요.</p>
          ) : (
            <ul className="category-manage-list">
              {sorted.map((c) => (
                <li key={c.id} className="category-manage-item">
                  <div className="category-manage-name">{c.name}</div>
                  <div className="actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => onRename?.(c.id, c.name)}
                    >
                      이름변경
                    </button>
                    <button
                      type="button"
                      className="button danger"
                      onClick={() => onDelete?.(c.id)}
                    >
                      삭제
                    </button>
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

