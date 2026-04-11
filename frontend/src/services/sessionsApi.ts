import { API_ROUTES } from '../config/api';
import { Session } from '../types';
import { fetchJson, getAuthHeaders } from './apiClient';

export async function fetchSessionsFromBackend(): Promise<Session[]> {
  const payload = await fetchJson<Session[]>(API_ROUTES.sessions, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });
  return Array.isArray(payload) ? payload : [];
}

export async function saveSessionToBackend(session: Session): Promise<Session> {
  return fetchJson<Session>(API_ROUTES.sessions, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(session),
  });
}
