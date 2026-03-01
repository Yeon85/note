import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    try {
      const response = await apiClient.post('/api/auth/forgot-password', { email });
      setMessage(response.message);
      if (response.resetUrl) {
        setResetUrl(response.resetUrl);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="card-body">
          <AuthBrand title="BlueNote" tagline="비밀번호 찾기" />
          <p className="auth-desc muted">이메일이 존재하면 비밀번호 재설정 링크를 보냅니다.</p>
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
            {message && <p className="success">{message}</p>}
            {resetUrl && (
              <p className="muted" style={{ fontSize: '13px', marginTop: 8 }}>
                개발용 리셋 링크: <a href={resetUrl}>{resetUrl}</a>
              </p>
            )}
            {error && <p className="error">{error}</p>}
            <button type="submit" className="button primary button-block">재설정 링크 받기</button>
          </form>
          <div className="auth-links">
            <Link to="/">로그인으로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
