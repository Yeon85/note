import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NoteCard from '../components/NoteCard';
import NoteForm from '../components/NoteForm';
import { apiClient } from '../lib/apiClient';
import { clearSession, getCurrentUser } from '../lib/authStore';

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
            노트
            <span className="pill">내 노트</span>
          </div>
          <div className="actions">
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
              <span className="btn-label">+ 새 노트</span>
            </button>
            <span className="pill">
              {user?.id ? `ID ${user.id}` : 'ID -'} · {user?.name || '이름 없음'}
            </span>
            <span className="pill">{user?.email}</span>
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
              />
            </div>
          </section>

          <aside className="card sticky" style={{ display: 'none' }}>
            <div className="card-body">
              <div className="row">
                <h2>사용 팁</h2>
              </div>
              <p className="muted">
                아래 노트 카드를 <b>클릭</b>하면 해당 노트가 에디터에서 바로 열립니다.
              </p>
              <p className="muted">
                “새 노트 작성” 버튼으로 에디터에서 바로 작성할 수도 있어요.
              </p>
            </div>
          </aside>
        </div>
        )}

        <section>
          {notes.length === 0 && (
            <p className="pill">{listOnly ? '아직 노트가 없습니다.' : '아직 노트가 없습니다. 위에서 첫 노트를 만들어주세요.'}</p>
          )}
          <div className="notes-grid">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={(n) => navigate(`/editor?noteId=${n.id}`)}
                onSelect={(n) => navigate(`/editor?noteId=${n.id}`)}
                onDelete={removeNote}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
