/**
 * auth 페이지 상단 브랜드: 쉘 아이콘 + 타이틀 + 태그라인 (색상 유지, 형태만 적용)
 */
export default function AuthBrand({ title, tagline, variant }) {
  return (
    <div className={`auth-brand${variant ? ` auth-brand--${variant}` : ''}`}>
      <div className="auth-brand-icon" aria-hidden="true">
        <span className="auth-brand-emoji">🐚</span>
      </div>
      <h1 className="auth-brand-title">{title}</h1>
      {tagline && <p className="auth-tagline">{tagline}</p>}
    </div>
  );
}
