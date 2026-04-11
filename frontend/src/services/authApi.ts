import { API_BASE_URL, API_ROUTES } from '../config/api';

interface BackendAuthResponse {
  message?: string;
  token?: string;
  token_type?: string;
  expires_in?: number;
  detail?: string;
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
    const message = payload.detail || payload.message || 'Request failed';
    throw new Error(message);
  }

  return payload;
}

export async function loginWithBackend(email: string, password: string): Promise<{ token: string; message: string }> {
  const payload = await postAuth(API_ROUTES.login, email, password);
  const message = payload.message || 'Login failed';

  if (!payload.token) {
    throw new Error('Backend did not return an auth token');
  }

  return {
    token: payload.token,
    message,
  };
}

export async function signupWithBackend(email: string, password: string): Promise<{ token: string; message: string }> {
  const payload = await postAuth(API_ROUTES.signup, email, password);
  const message = payload.message || 'Sign up failed';

  if (!payload.token) {
    throw new Error('Backend did not return an auth token');
  }

  return {
    token: payload.token,
    message,
  };
}