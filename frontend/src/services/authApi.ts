import { API_BASE_URL, API_ROUTES } from '../config/api';

export interface AuthUser {
  username: string;
  email: string;
  display_name: string;
  created_at: string;
}

interface BackendAuthResponse {
  message?: string;
  token?: string;
  token_type?: string;
  expires_in?: number;
  detail?: string;
  user?: AuthUser;
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

interface PostAuthOptions {
  displayName?: string;
}

async function postAuth(path: string, email: string, password: string, options?: PostAuthOptions): Promise<BackendAuthResponse> {
  const payloadBody: Record<string, string> = {
    username: email,
    email,
    password,
  };

  if (options?.displayName) {
    payloadBody.display_name = options.displayName;
  }

  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadBody),
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

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginWithBackend(email: string, password: string): Promise<{ token: string; message: string; user: AuthUser }> {
  const payload = await postAuth(API_ROUTES.login, email, password);
  const message = payload.message || 'Login failed';

  if (!payload.token || !payload.user) {
    throw new Error('Backend did not return an auth token');
  }

  return {
    token: payload.token,
    message,
    user: payload.user,
  };
}

export async function signupWithBackend(email: string, password: string, displayName?: string): Promise<{ token: string; message: string; user: AuthUser }> {
  const payload = await postAuth(API_ROUTES.signup, email, password, { displayName });
  const message = payload.message || 'Sign up failed';

  if (!payload.token || !payload.user) {
    throw new Error('Backend did not return an auth token');
  }

  return {
    token: payload.token,
    message,
    user: payload.user,
  };
}

export async function fetchCurrentUserProfile(): Promise<AuthUser> {
  const response = await fetch(buildUrl(API_ROUTES.profile), {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return (await response.json()) as AuthUser;
}

export async function logoutFromBackend(): Promise<void> {
  const response = await fetch(buildUrl(API_ROUTES.logout), {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to logout session');
  }
}