import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import SummernoteEditor from '../components/SummernoteEditor';
import { apiClient } from '../lib/apiClient';
import { clearSession, getCurrentUser } from '../lib/authStore';
import DOMPurify from 'dompurify';

export default function Editor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const isEditMode = Boolean(noteId);
  const isNewNote = searchParams.get('new') === '1';

  const [theme, setTheme] = useState(localStorage.getItem('editor_theme') || 'light');
  const [title, setTitle] = useState(localStorage.getItem('editor_title') || '');
  const [content, setContent] = useState(localStorage.getItem('editor_draft') || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const user = getCurrentUser();
  const [myNotes, setMyNotes] = useState([]);

  function logout() {
    clearSession();
    window.location.href = '/';
  }

  useEffect(() => {
    async function loadNote() {
      if (!isEditMode) return;
      try {
        setIsLoading(true);
        setError('');
        setMessage('');
        setFiles([]);
        const response = await apiClient.get(`/api/notes/${noteId}`);
        setTitle(response.note.title || '');
        setContent(response.note.content || '');
        setTheme(response.note.theme || 'light');
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadNote();
  }, [isEditMode, noteId]);

  async function fetchMyNotes() {
    try {
      const response = await apiClient.get('/api/notes');
      setMyNotes(response.notes || []);
    } catch {
      // ignore list errors on editor page
    }
  }

  useEffect(() => {
    fetchMyNotes();
  }, []);

  function handleContentChange(event) {
    const nextValue = event.target.value;
    setContent(nextValue);
    localStorage.setItem('editor_draft', nextValue);
  }

  function handleTitleChange(event) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    localStorage.setItem('editor_title', nextTitle);
  }

  function clearDraft() {
    setTitle('');
    setContent('');
    setFiles([]);
    setMessage('');
    setError('');
    localStorage.removeItem('editor_title');
    localStorage.removeItem('editor_draft');
  }

  useEffect(() => {
    if (!isEditMode && isNewNote) {
      clearDraft();
      setTheme('light');
      localStorage.setItem('editor_theme', 'light');
      navigate('/editor', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, isNewNote]);

  function getDateTimeString() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  async function saveToNotes() {
    try {
      setIsSaving(true);
      setError('');
      setMessage('');

      const finalTitle = title.trim() || getDateTimeString();
      const formData = new FormData();
      formData.append('title', finalTitle);
      formData.append('content', content.trim());
      formData.append('theme', theme);
      for (const file of files) {
        formData.append('files', file);
      }

      const response = isEditMode
        ? await apiClient.put(`/api/notes/${noteId}`, formData)
        : await apiClient.post('/api/notes', formData);

      setMessage(isEditMode ? '노트가 수정되었습니다.' : '노트로 저장되었습니다.');
      setFiles([]);
      localStorage.removeItem('editor_title');
      localStorage.removeItem('editor_draft');
      await fetchMyNotes();
      navigate('/notes?list=1');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page">
      <header className="app-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-badge" aria-hidden="true" />
            노트
          </div>
          <div className="actions">
            <span className="pill">
              {user?.id ? `ID ${user.id}` : 'ID -'} · {user?.name || '이름 없음'}
            </span>
       
            <button
              type="button"
              className="button secondary icon-button"
              aria-label="목록으로"
              onClick={() => navigate('/notes?list=1')}
            >
              <span className="btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 7h14M5 12h14M5 17h14" />
                </svg>
              </span>
              <span className="btn-label">목록으로</span>
            </button>
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
        <div className="card">
          <div className="card-body">
            <div className="row editor-title-row">
             <div class="row">
              <h1>{isEditMode ? '노트 수정' : '노트 작성'}</h1>
              
              </div>
              <input
                id="title"
                className="editor-title-input"
                aria-label="제목"
                value={title}
                onChange={handleTitleChange}
                placeholder="제목"
                maxLength={255}
                disabled={isLoading}
              />
              <div className="actions">
                <button type="button" className="button primary" onClick={saveToNotes} disabled={isSaving || isLoading}>
                  {isSaving ? '저장 중...' : (isEditMode ? '수정' : '저장')}
                </button>
             </div>
             
            </div>

            <div className="field">
              <SummernoteEditor
                value={content}
                onChange={(next) => {
                  setContent(next);
                  localStorage.setItem('editor_draft', next);
                }}
                placeholder="내용을 입력하세요..."
                height={320}
                theme={theme}
              />
            </div>

            <div className="field">
             
              <FileUpload onFilesChange={setFiles} />
              {files.length > 0 && (
                <p className="muted">첨부 파일: {files.map((file) => file.name).join(', ')}</p>
              )}
            </div>

            {isLoading && <p className="muted">노트를 불러오는 중...</p>}
            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}
          </div>
        </div>

        <div className="ice-section">
          <div className="row" style={{ marginTop: 16 }}>
            <h2>내가 저장한 노트</h2>
            <button type="button" className="button secondary" onClick={fetchMyNotes}>
              새로고침
            </button>
          </div>
          <div className="ice-grid">
            {myNotes.slice(0, 12).map((note) => {
              const preview = DOMPurify.sanitize(note.content || '');
              const text = preview.replace(/<[^>]*>/g, '').slice(0, 120);
              return (
                <button
                  key={note.id}
                  type="button"
                  className="ice-card"
                  onClick={() => navigate(`/editor?noteId=${note.id}`)}
                >
                  <div className="ice-title">{note.title}</div>
                  <div className="ice-preview">{text}</div>
                  <div className="ice-meta">
                    <span>#{note.id}</span>
                    <span>{note.theme === 'dark' ? '어둡게' : '밝게'}</span>
                    <span>{(note.files?.length || 0) > 0 ? `파일 ${note.files.length}` : '파일 없음'}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {myNotes.length === 0 && <p className="muted">아직 저장한 노트가 없어요.</p>}
        </div>
      </div>
    </main>
  );
}
