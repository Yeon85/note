import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await apiClient.post('/api/auth/reset-password', { token, password });
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="card-body">
          <AuthBrand title="BlueNote" tagline="비밀번호 재설정" />
          {!token && <p className="error">주소에 토큰이 없습니다.</p>}
          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="password">새 비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자 이상"
                autoComplete="new-password"
              />
            </div>
            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}
            <button type="submit" className="button primary button-block" disabled={!token}>
              비밀번호 변경
            </button>
          </form>
          <div className="auth-links">
            <Link to="/">로그인으로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
