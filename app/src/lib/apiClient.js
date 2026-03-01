import { getToken } from './authStore';

// In production, VITE_API_BASE_URL must be set (e.g. https://your-api.example.com).
// In dev, fall back to localhost backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:4000' : '');
export { API_BASE_URL };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}, retried = false) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    if (!retried && (networkError.message === 'Failed to fetch' || networkError.name === 'TypeError')) {
      await sleep(2000);
      return request(path, options, true);
    }
    throw new Error('서버에 연결할 수 없습니다. 잠시 후 새로고침해 주세요.');
  }

  const text = await response.text();
  const payload = (() => {
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  })();

  if (!response.ok) {
    if (!retried && response.status >= 500) {
      await sleep(1500);
      return request(path, options, true);
    }
    const msg = payload.message || payload.error || response.statusText || `요청 실패 (${response.status})`;
    throw new Error(msg);
  }

  return payload;
}

export const apiClient = {
  get(path) {
    return request(path);
  },
  post(path, body, options = {}) {
    return request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    });
  },
  put(path, body, options = {}) {
    return request(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    });
  },
  delete(path) {
    return request(path, {
      method: 'DELETE',
    });
  },
};
