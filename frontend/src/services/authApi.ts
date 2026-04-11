import { API_ROUTES } from '../config/api';
import { fetchJson, getAuthHeaders } from './apiClient';

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

interface BackendSessionResponse {
  authenticated: boolean;
  username: string;
  user: AuthUser;
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

  return fetchJson<BackendAuthResponse>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadBody),
  });
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

export async function validateBackendSession(): Promise<BackendSessionResponse> {
  return fetchJson<BackendSessionResponse>(API_ROUTES.session, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });
}

export async function updateUserProfile(displayName: string): Promise<AuthUser> {
  return fetchJson<AuthUser>(API_ROUTES.profile, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ display_name: displayName }),
  });
}

export async function logoutFromBackend(): Promise<void> {
  await fetchJson<void>(API_ROUTES.logout, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
  });
}