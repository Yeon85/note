/**
 * auth 페이지 상단 브랜드: 쉘 아이콘 + 타이틀 + 태그라인 (색상 유지, 형태만 적용)
 */
export default function AuthBrand({ title, tagline }) {
  return (
    <div className="auth-brand">
      <div className="auth-brand-icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="authShellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(92, 71, 245, 1)" />
              <stop offset="100%" stopColor="rgba(240, 90, 170, 1)" />
            </linearGradient>
          </defs>
          {/* 쉘 형태: 단순화된 조개/나선형 */}
          <path
            d="M32 8c-12 8-20 18-20 28 0 8 6 14 20 14s20-6 20-14c0-10-8-20-20-28zm0 6c8 6 14 14 14 22 0 4-3 8-14 8S18 40 18 36c0-8 6-16 14-22z"
            fill="url(#authShellGrad)"
            fillRule="evenodd"
          />
        </svg>
      </div>
      <h1 className="auth-brand-title">{title}</h1>
      {tagline && <p className="auth-tagline">{tagline}</p>}
    </div>
  );
}
