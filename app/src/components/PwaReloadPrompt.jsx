import { useState, useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';

export default function PwaReloadPrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateSwRef = useRef(null);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
    updateSwRef.current = updateSW;
  }, []);

  const handleClose = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  const handleReload = () => {
    if (updateSwRef.current) {
      updateSwRef.current(true);
    } else {
      window.location.reload();
    }
  };

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="pwa-prompt" role="alert" aria-live="polite">
      {needRefresh ? (
        <>
          <span className="pwa-prompt__text">새 버전이 있습니다.</span>
          <button type="button" className="pwa-prompt__btn pwa-prompt__btn--reload" onClick={handleReload}>
            새로고침
          </button>
        </>
      ) : (
        <>
          <span className="pwa-prompt__text">앱을 오프라인에서 사용할 수 있습니다.</span>
        </>
      )}
      <button type="button" className="pwa-prompt__btn pwa-prompt__btn--close" onClick={handleClose} aria-label="닫기">
        ✕
      </button>
    </div>
  );
}
