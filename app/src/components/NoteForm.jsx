import { useState } from 'react';
import FileUpload from './FileUpload';
import SummernoteEditor from './SummernoteEditor';

export default function NoteForm({
  initialNote,
  onSubmit,
  onCancel,
  heading,
  editorHeight,
}) {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [theme, setTheme] = useState(initialNote?.theme || 'light');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해 주세요.');
      return;
    }
    setError('');

    await onSubmit({ title, content, theme, files });
    if (!initialNote) {
      setTitle('');
      setContent('');
      setTheme('light');
      setFiles([]);
    }
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <div className="row note-form-header">
        {heading && <h2 className="note-form-heading">{heading}</h2>}
        <input
          className="note-form-title-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="제목"
          maxLength={255}
        />
        <div className="actions">
          <button type="submit" className="button primary">
            {initialNote ? '수정' : '저장'}
          </button>
          {onCancel && (
            <button type="button" className="button secondary" onClick={onCancel}>
              취소
            </button>
          )}
        </div>
      </div>
      <SummernoteEditor
        value={content}
        onChange={setContent}
        placeholder="내용을 입력하세요..."
        height={typeof editorHeight === 'number' ? editorHeight : 260}
      />
      <FileUpload onFilesChange={setFiles} />
      {error && <p className="error">{error}</p>}
    </form>
  );
}
