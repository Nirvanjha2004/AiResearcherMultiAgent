import { API_BASE_URL, API_ROUTES } from '../config/api';

export interface ExportTrackingPayload {
  action: 'copy' | 'download';
  status: 'success' | 'failed';
  session_id?: string;
  source?: string;
  format?: string;
  file_name?: string;
  content_length?: number;
  error?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return { 'Content-Type': 'application/json' };
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function trackExportEvent(payload: ExportTrackingPayload): Promise<void> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return;
  }

  try {
    await fetch(`${API_BASE_URL}${API_ROUTES.exportEvents}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch {
    // Tracking should never block UX actions.
  }
}
