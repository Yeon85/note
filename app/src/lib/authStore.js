const TOKEN_KEY = 'note_app_token';
const USER_KEY = 'note_app_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    clearSession();
    return null;
  }
}
