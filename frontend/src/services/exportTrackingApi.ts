import { API_ROUTES } from '../config/api';
import { buildApiUrl, getAuthHeaders, getAuthToken } from './apiClient';

export interface ExportLifecycleEvent {
  id: string;
  username: string;
  action: 'copy' | 'download' | 'unknown';
  status: 'success' | 'failed' | 'unknown';
  session_id?: string | null;
  source: string;
  format: string;
  file_name?: string | null;
  content_length: number;
  error?: string | null;
  created_at: string;
}

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

export async function trackExportEvent(payload: ExportTrackingPayload): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    return;
  }

  try {
    await fetch(buildApiUrl(API_ROUTES.exportEvents), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Tracking should never block UX actions.
  }
}

export async function listExportEvents(): Promise<ExportLifecycleEvent[]> {
  const token = getAuthToken();
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(buildApiUrl(API_ROUTES.exportEvents), {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return Array.isArray(payload) ? (payload as ExportLifecycleEvent[]) : [];
  } catch {
    return [];
  }
}
