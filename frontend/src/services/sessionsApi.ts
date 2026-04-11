import { API_BASE_URL, API_ROUTES } from '../config/api';
import { Session } from '../types';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchSessionsFromBackend(): Promise<Session[]> {
  const response = await fetch(`${API_BASE_URL}${API_ROUTES.sessions}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }

  const payload = (await response.json()) as Session[];
  return Array.isArray(payload) ? payload : [];
}

export async function saveSessionToBackend(session: Session): Promise<Session> {
  const response = await fetch(`${API_BASE_URL}${API_ROUTES.sessions}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    throw new Error('Failed to save session');
  }

  return (await response.json()) as Session;
}
