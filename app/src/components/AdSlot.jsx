import { useEffect, useRef, useState } from 'react';

/**
 * 노트 목록 하단 광고 — 뷰포트에 들어온 뒤에만 로드해서 초기 로딩 속도에 영향 없음.
 * VITE_ADSENSE_CLIENT, VITE_ADSENSE_SLOT 설정 시에만 표시.
 */
export default function AdSlot() {
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const insRef = useRef(null);
  const client = import.meta.env.VITE_ADSENSE_CLIENT || '';
  const slot = import.meta.env.VITE_ADSENSE_SLOT || '';

  // 광고 미설정이면 아무것도 안 그림 (DOM/스크립트 없음)
  if (!client || !slot) return null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setShouldLoad(true);
      },
      { rootMargin: '200px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 뷰포트 들어온 뒤에만 스크립트 로드 + ins 렌더
  useEffect(() => {
    if (!shouldLoad) return;
    const id = 'adsense-script';
    if (document.getElementById(id)) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSlot push failed', e);
      }
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + client;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSlot push failed', e);
      }
    };
    document.head.appendChild(script);
  }, [shouldLoad, client, slot]);

  return (
    <aside ref={containerRef} className="ad-slot" aria-label="광고">
      <span className="ad-slot-label">광고</span>
      <div className="ad-slot-inner">
        {shouldLoad && (
          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={client}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
      </div>
    </aside>
  );
}
