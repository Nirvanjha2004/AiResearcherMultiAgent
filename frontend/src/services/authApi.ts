import { API_BASE_URL, API_ROUTES } from '../config/api';

interface BackendAuthResponse {
  message?: string;
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function postAuth(path: string, username: string, password: string): Promise<BackendAuthResponse> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  let payload: BackendAuthResponse = {};
  try {
    payload = (await response.json()) as BackendAuthResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message = payload.message || 'Request failed';
    throw new Error(message);
  }

  return payload;
}

export async function loginWithBackend(email: string, password: string): Promise<{ token: string; message: string }> {
  const payload = await postAuth(API_ROUTES.login, email, password);
  const message = payload.message || 'Login failed';

  if (!/logged in successfully/i.test(message)) {
    throw new Error(message);
  }

  return {
    token: `backend-session-${email}`,
    message,
  };
}

export async function signupWithBackend(email: string, password: string): Promise<{ token: string; message: string }> {
  const payload = await postAuth(API_ROUTES.signup, email, password);
  const message = payload.message || 'Sign up failed';

  if (!/signed up successfully/i.test(message)) {
    throw new Error(message);
  }

  return {
    token: `backend-session-${email}`,
    message,
  };
}