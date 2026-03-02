import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NoteForm from '../components/NoteForm';
import CategoryManagerModal from '../components/CategoryManagerModal';
import { apiClient } from '../lib/apiClient';
import { clearSession, getCurrentUser } from '../lib/authStore';
import DOMPurify from 'dompurify';

function toFormData(note) {
  const formData = new FormData();
  formData.append('title', note.title);
  formData.append('content', note.content);
  formData.append('theme', note.theme);
  if (note.categoryId != null) {
    formData.append('categoryId', String(note.categoryId));
  }
  for (const file of note.files || []) {
    formData.append('files', file);
  }
  return formData;
}

export default function NotesList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listOnly = searchParams.get('list') === '1';
  const selectedCategoryRaw = searchParams.get('categoryId') || '';
  const selectedCategory = selectedCategoryRaw === 'none' ? '' : selectedCategoryRaw;
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [error, setError] = useState('');
  const user = getCurrentUser();

  const categoryOptions = useMemo(() => {
    const base = [
      { value: '', label: '전체' },
    ];
    const cats = (categories || []).map((c) => ({ value: String(c.id), label: c.name }));
    return base.concat(cats);
  }, [categories]);

  function setCategoryFilter(nextValue) {
    const next = new URLSearchParams(searchParams);
    if (nextValue) next.set('categoryId', nextValue);
    else next.delete('categoryId');
    if (listOnly) next.set('list', '1');
    setSearchParams(next, { replace: true });
  }

  async function handleFilterSelectChange(nextValue) {
    if (nextValue !== '__add__') {
      setCategoryFilter(nextValue);
      return;
    }

    const prev = selectedCategory;
    const created = await addCategory();
    if (created?.id) {
      setCategoryFilter(String(created.id));
    } else {
      setCategoryFilter(prev);
    }
  }

  async function fetchCategories() {
    try {
      const response = await apiClient.get('/api/categories');
      setCategories(response.categories || []);
    } catch {
      // ignore: categories are optional UI enhancement
    }
  }

  async function fetchNotes() {
    try {
      const response = await apiClient.get('/api/notes');
      setNotes(response.notes || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function fetchNotesByCategory(categoryIdValue) {
    try {
      const qp = categoryIdValue ? `?categoryId=${encodeURIComponent(categoryIdValue)}` : '';
      const response = await apiClient.get(`/api/notes${qp}`);
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
    fetchCategories();
    fetchNotesByCategory(selectedCategory);
  }, []);

  useEffect(() => {
    if (!user) return;
    // Backward-compat: if URL had categoryId=none, treat it as 전체 and clean up the param.
    if (selectedCategoryRaw === 'none') {
      setCategoryFilter('');
      return;
    }
    fetchNotesByCategory(selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  async function createNote(note) {
    try {
      setError('');
      await apiClient.post('/api/notes', toFormData(note));
      await fetchNotesByCategory(selectedCategory);
      navigate('/notes?list=1', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeNote(id) {
    try {
      setError('');
      await apiClient.delete(`/api/notes/${id}`);
      await fetchNotesByCategory(selectedCategory);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function createCategoryByName(name) {
    try {
      setError('');
      const created = await apiClient.post('/api/categories', { name });
      await fetchCategories();
      return created;
    } catch (requestError) {
      setError(requestError.message);
      return null;
    }
  }

  async function addCategory(nameFromUi) {
    const name = nameFromUi ?? window.prompt('새 카테고리 이름을 입력하세요');
    if (!name) return null;
    return createCategoryByName(name);
  }

  async function deleteCategory(categoryId) {
    const ok = window.confirm('이 카테고리를 삭제할까요? (해당 노트들은 미분류로 변경됩니다)');
    if (!ok) return;

    try {
      setError('');
      await apiClient.delete(`/api/categories/${categoryId}`);
      await fetchCategories();
      if (selectedCategory === String(categoryId)) {
        const next = new URLSearchParams(searchParams);
        next.delete('categoryId');
        setSearchParams(next, { replace: true });
      }
      await fetchNotesByCategory(selectedCategory === String(categoryId) ? '' : selectedCategory);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function renameCategory(categoryId, currentName) {
    const name = window.prompt('카테고리 이름을 수정하세요', currentName || '');
    if (!name) return;
    if (name.trim() === currentName) return;

    try {
      setError('');
      await apiClient.put(`/api/categories/${categoryId}`, { name });
      await fetchCategories();
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
                  <path d="M4 4v16" />
                  <path d="M4 4h7" />
                  <path d="M4 20h7" />
                  <path d="M11 12h9" />
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
                categories={categories}
                onAddCategory={addCategory}
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
              <div className="actions">
                <div className="filter-bar">
                  <select
                    className="select select-compact filter-select"
                    value={selectedCategory}
                    onChange={(e) => handleFilterSelectChange(e.target.value)}
                    aria-label="카테고리 필터"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value || '__all'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    <option value="__add__">+ 카테고리 추가…</option>
                  </select>
                  <button
                    type="button"
                    className="button secondary icon-button icon-only"
                    onClick={() => fetchNotesByCategory(selectedCategory)}
                    aria-label="새로고침"
                    title="새로고침"
                  >
                    <span className="btn-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                        <path d="M21 3v6h-6" />
                      </svg>
                    </span>
                    <span className="btn-label">새로고침</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="category-chips" aria-label="카테고리 빠른 필터">
              <span className={`chip ${selectedCategory === '' ? 'active' : ''}`}>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => setCategoryFilter('')}
                  aria-label="전체 보기"
                  title="전체 보기"
                >
                  전체
                </button>
              </span>
              {categories.map((c) => (
                <span
                  key={c.id}
                  className={`chip ${selectedCategory === String(c.id) ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => setCategoryFilter(selectedCategory === String(c.id) ? '' : String(c.id))}
                    aria-label={`${c.name} 필터`}
                    title="클릭하면 이 카테고리만 보기"
                  >
                    {c.name}
                  </button>
                </span>
              ))}
              <span className="chip chip-manager">
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  aria-label="카테고리 관리"
                  title="카테고리 관리"
                >
                  카테고리 관리
                </button>
              </span>
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
                      <span>{note.categoryName ? note.categoryName : '카테고리 없음'}</span>
                      <span>{(note.files?.length || 0) > 0 ? `파일 ${note.files.length}` : '파일 없음'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <CategoryManagerModal
        open={isCategoryManagerOpen}
        categories={categories}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCreate={createCategoryByName}
        onRename={renameCategory}
        onDelete={deleteCategory}
      />
    </main>
  );
}
