import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'summernote/dist/summernote-lite.min.css';
import 'summernote/dist/summernote-lite.min.js';

if (!window.jQuery) {
  window.$ = $;
  window.jQuery = $;
}

export default function SummernoteEditor({
  value,
  onChange,
  placeholder,
  height = 240,
  theme = 'light',
}) {
  const hostRef = useRef(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const el = $(hostRef.current);
    el.summernote({
      placeholder,
      height,
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'clear']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['insert', ['link']],
        ['view', ['codeview']],
      ],
      callbacks: {
        onChange(contents) {
          onChange?.(contents);
        },
      },
    });

    isReadyRef.current = true;
    el.summernote('code', value || '');

    return () => {
      isReadyRef.current = false;
      try {
        el.summernote('destroy');
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isReadyRef.current) return;
    const el = $(hostRef.current);
    const current = el.summernote('code');
    const next = value || '';
    if (current !== next) {
      el.summernote('code', next);
    }
  }, [value]);

  return <div ref={hostRef} className={theme === 'dark' ? 'sn-root theme-dark' : 'sn-root'} />;
}

