import { API_BASE_URL } from '../lib/apiClient';
import DOMPurify from 'dompurify';

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

export default function NoteCard({ note, onEdit, onDelete, onSelect }) {
  const safeTextPreview = stripHtml(DOMPurify.sanitize(note.content || '')).slice(0, 140);
  return (
    <article
      className={`note-card ${note.theme} clickable`}
      onClick={() => onSelect?.(note)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onSelect?.(note);
        }
      }}
    >
      <div className="note-header">
        <h3>{note.title}</h3>
      </div>
      <p>{safeTextPreview}</p>
      {note.files.length > 0 && (
        <ul className="file-list">
          {note.files.map((file) => (
            <li key={file.id}>
              <a
                href={`${API_BASE_URL}${file.url}`}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                {file.originalName}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button
          type="button"
          className="button secondary"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(note);
          }}
        >
          수정
        </button>
        <button
          type="button"
          className="button danger"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(note.id);
          }}
        >
          삭제
        </button>
      </div>
    </article>
  );
}
