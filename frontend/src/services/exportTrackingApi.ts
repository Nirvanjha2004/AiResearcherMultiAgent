import { API_ROUTES } from '../config/api';
import { buildApiUrl, getAuthHeaders, getAuthToken } from './apiClient';

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
