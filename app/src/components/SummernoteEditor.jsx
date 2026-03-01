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
  /** 에디터 내부에서 변경이 일어났을 때 true. 이때는 value → 에디터 동기화를 건너뛰어 커서가 첫 줄로 튀는 걸 막음 */
  const isInternalChangeRef = useRef(false);

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
          isInternalChangeRef.current = true;
          onChange?.(contents);
        },
        onPaste(event) {
          // 텍스트/서식 붙여넣기는 Summernote 기본 동작 유지.
          // 클립보드에 "이미지"가 있으면 base64로 에디터에 삽입.
          const originalEvent = event?.originalEvent || event;
          const items = originalEvent?.clipboardData?.items;
          if (!items || !items.length) return;

          const imageItem = Array.from(items).find(
            (item) => typeof item.type === 'string' && item.type.startsWith('image/'),
          );
          if (!imageItem) return;

          const file = imageItem.getAsFile?.();
          if (!file) return;

          originalEvent.preventDefault?.();
          event.preventDefault?.();

          const reader = new FileReader();
          reader.onload = () => {
            try {
              el.summernote('insertImage', String(reader.result), file.name || 'image');
            } catch {
              // ignore
            }
          };
          reader.readAsDataURL(file);
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
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    const el = $(hostRef.current);
    const current = el.summernote('code');
    const next = value || '';
    if (current !== next) {
      el.summernote('code', next);
    }
  }, [value]);

  return <div ref={hostRef} className={theme === 'dark' ? 'sn-root theme-dark' : 'sn-root'} />;
}

