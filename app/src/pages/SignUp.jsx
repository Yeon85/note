import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthBrand from '../components/AuthBrand';
import { apiClient } from '../lib/apiClient';
import { setSession } from '../lib/authStore';

const ROLES = [
  { id: 'student', label: '학생', icon: '🎓' },
  { id: 'professor', label: '교수', icon: '👤' },
  { id: 'admin', label: '관리자', icon: '🛡' },
];

export default function SignUp() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [error, setError] = useState('');

  const agreeAll = agreePrivacy && agreeTerms && agreeMarketing;
  function setAgreeAll(checked) {
    setAgreePrivacy(checked);
    setAgreeTerms(checked);
    setAgreeMarketing(checked);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!agreePrivacy || !agreeTerms) {
      setError('필수 약관에 동의해 주세요.');
      return;
    }
    try {
      const response = await apiClient.post('/api/auth/register', {
        name,
        email,
        password,
        agreePrivacy,
        agreeTerms,
        agreeMarketing,
      });
      setSession({ token: response.accessToken, user: response.user });
      window.location.href = '/notes';
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="card-body">
          <AuthBrand title="BlueNote" tagline="연구실 통합 관리 플랫폼" />
          {error && (
            <div className="auth-error-box" role="alert">
              {error}
            </div>
          )}
          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <span className="field-label">역할 선택</span>
              <div className="role-select">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`role-option ${role === r.id ? 'active' : ''}`}
                    onClick={() => setRole(r.id)}
                  >
                    <span className="role-icon" aria-hidden="true">{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="password">비밀번호</label>
              <div className="input-with-toggle">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="name">이름</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
              />
            </div>
            <div className="auth-info-box">
              <span className="auth-info-check">✓</span>
              <div>
                <div>안전한 계정 생성</div>
                <div className="muted">비밀번호는 암호화되어 저장됩니다. 최소 6자 이상 설정해주세요.</div>
              </div>
            </div>
            <div className="field terms-row">
              <label className="checkbox-label terms-all">
                <input
                  type="checkbox"
                  checked={agreeAll}
                  onChange={(e) => setAgreeAll(e.target.checked)}
                />
                <span><strong>전체 동의</strong></span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                />
                <span>[필수] 개인정보 수집 및 이용에 동의합니다. <button type="button" className="link-button">약관 보기</button></span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>[필수] 서비스 이용약관에 동의합니다. <button type="button" className="link-button">약관 보기</button></span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                />
                <span>[선택] 마케팅 정보 수신에 동의합니다. (이메일, SMS 등)</span>
              </label>
            </div>
            <button type="submit" className="button primary button-block">회원가입</button>
          </form>
          <p className="auth-divider">또는</p>
          <p className="auth-footer">
            이미 계정이 있으신가요? <Link to="/">로그인하기</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
