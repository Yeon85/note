import { Navigate, Route, Routes } from 'react-router-dom';
import Editor from './pages/Editor';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import NotesList from './pages/NotesList';
import ResetPassword from './pages/ResetPassword';
import SignUp from './pages/SignUp';
import { getToken } from './lib/authStore';

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/" replace />;
}

export default function App() {
  const hasToken = Boolean(getToken());
  return (
    <Routes>
      <Route path="/" element={hasToken ? <Navigate to="/notes" replace /> : <Login />} />
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
  );
}
