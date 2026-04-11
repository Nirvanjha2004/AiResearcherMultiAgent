import { API_BASE_URL } from '../config/api';

export function buildApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(buildApiUrl(path), init);

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload && typeof payload === 'object' && 'detail' in payload
      ? String((payload as { detail?: unknown }).detail ?? 'Request failed')
      : 'Request failed';
    throw new Error(detail);
  }

  return payload as T;
}
