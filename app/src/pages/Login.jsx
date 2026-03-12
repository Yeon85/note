import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthBrand from '../components/AuthBrand';
import { apiClient } from '../lib/apiClient';
import { setSession } from '../lib/authStore';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      setSession({ token: response.accessToken, user: response.user });
      navigate('/notes?list=1');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="card-body">
          <AuthBrand title="SHELL-NOTE" tagline="연구실 통합 관리 플랫폼" />
          <form className="form" onSubmit={handleSubmit}>
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
              <div className="field-header">
                <label htmlFor="password">비밀번호</label>
                <Link className="forgot-link" to="/forgot-password">비밀번호 찾기</Link>
              </div>
              <div className="input-with-toggle">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  autoComplete="current-password"
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
            {error && <p className="error">{error}</p>}
            <button type="submit" className="button primary button-block">로그인</button>
          </form>
          <p className="auth-footer auth-footer-center">
            계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
