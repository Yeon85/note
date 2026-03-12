import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PwaReloadPrompt from './components/PwaReloadPrompt';
import { getToken } from './lib/authStore';

const Login = lazy(() => import('./pages/Login'));
const NotesList = lazy(() => import('./pages/NotesList'));
const Editor = lazy(() => import('./pages/Editor'));
const SignUp = lazy(() => import('./pages/SignUp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/" replace />;
}

function PageFallback() {
  return <div style={{ padding: 24, textAlign: 'center' }}>로딩 중…</div>;
}

export default function App() {
  const hasToken = Boolean(getToken());
  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={hasToken ? <Navigate to="/notes?list=1" replace /> : <Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/notes"
            element={(
              <ProtectedRoute>
                <NotesList />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/editor"
            element={(
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <PwaReloadPrompt />
    </>
  );
}
