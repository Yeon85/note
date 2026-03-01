import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NoteForm from '../components/NoteForm';
import { apiClient } from '../lib/apiClient';
import { clearSession, getCurrentUser } from '../lib/authStore';
import DOMPurify from 'dompurify';

function toFormData(note) {
  const formData = new FormData();
  formData.append('title', note.title);
  formData.append('content', note.content);
  formData.append('theme', note.theme);
  for (const file of note.files || []) {
    formData.append('files', file);
  }
  return formData;
}

export default function NotesList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listOnly = searchParams.get('list') === '1';
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');
  const user = getCurrentUser();

  async function fetchNotes() {
    try {
      const response = await apiClient.get('/api/notes');
      setNotes(response.notes || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchNotes();
  }, []);

  async function createNote(note) {
    try {
      setError('');
      await apiClient.post('/api/notes', toFormData(note));
      await fetchNotes();
      navigate('/notes?list=1', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeNote(id) {
    try {
      setError('');
      await apiClient.delete(`/api/notes/${id}`);
      await fetchNotes();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function logout() {
    clearSession();
    window.location.href = '/';
  }

  return (
    <main className="page">
      <header className="app-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-badge" aria-hidden="true" />
            <span className="brand-title">SHELL-NOTE</span>
          
          </div>
          <div className="actions">
            <span className="pill">
              {user?.id ? `ID ${user.id}` : 'ID -'} · {user?.name || '이름 없음'}
            </span>
            <span className="pill">{user?.email}</span>
            <button
              type="button"
              className="button secondary icon-button"
              aria-label="새 노트"
              onClick={() => navigate('/editor?new=1')}
            >
              <span className="btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="btn-label">새 노트</span>
            </button>
            <button type="button" className="button secondary icon-button" aria-label="로그아웃" onClick={logout}>
              <span className="btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 17l-1.5 1.5a4 4 0 0 1-5.5-5.8V11a4 4 0 0 1 5.5-5.8L10 6.7" />
                  <path d="M10 12h10" />
                  <path d="M17 9l3 3-3 3" />
                </svg>
              </span>
              <span className="btn-label">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        {error && <p className="error">{error}</p>}

        {!listOnly && (
        <div className="notes-layout">
          <section className="card">
            <div className="card-body">
              <NoteForm
                initialNote={null}
                onSubmit={createNote}
                heading="노트 작성"
                editorHeight={320}
              />
            </div>
          </section>
        </div>
        )}

        <section>
          {notes.length === 0 && (
            <p className="pill">{listOnly ? '아직 노트가 없습니다.' : '아직 노트가 없습니다. 위에서 첫 노트를 만들어주세요.'}</p>
          )}
          <div className="ice-section">
            <div className="row" style={{ marginTop: 16 }}>
              <h2>내가 저장한 노트</h2>
              <button type="button" className="button secondary" onClick={fetchNotes}>
                새로고침
              </button>
            </div>
            <div className="ice-grid">
              {notes.map((note) => {
                const preview = DOMPurify.sanitize(note.content || '');
                const text = preview.replace(/<[^>]*>/g, '').slice(0, 120);
                return (
                  <article
                    key={note.id}
                    className="ice-card ice-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/editor?noteId=${note.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        navigate(`/editor?noteId=${note.id}`);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="ice-delete"
                      aria-label="삭제"
                      title="삭제"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeNote(note.id);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>

                    <div className="ice-title">{note.title}</div>
                    <div className="ice-preview">{text}</div>
                    <div className="ice-meta">
                      <span>#{note.id}</span>
                      <span>{note.theme === 'dark' ? '어둡게' : '밝게'}</span>
                      <span>{(note.files?.length || 0) > 0 ? `파일 ${note.files.length}` : '파일 없음'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
