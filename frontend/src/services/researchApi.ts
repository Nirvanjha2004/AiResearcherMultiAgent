import { API_BASE_URL, API_ROUTES } from '../config/api';
import { AgentState } from '../types';

export interface StreamCallbacks {
  onLog: (line: string) => void;
  onComplete: (agentState: AgentState) => void;
  onError: (message: string) => void;
}

const REQUEST_PROGRESS_LOGS = [
  '--- PLANNER AGENT RUNNING ---',
  'Breaking query into sub-queries...',
  '--- RESEARCHER AGENT RUNNING ---',
  'Fetching evidence from sources...',
  '--- WRITER AGENT RUNNING ---',
  'Synthesizing final report...',
  '--- REVIEWER AGENT RUNNING ---',
  'Preparing final response...',
];

function normalizeAgentState(query: string, payload: unknown): AgentState {
  const defaultState: AgentState = {
    user_query: query,
    subqueries: [],
    raw_data: [],
    final_output: '',
    review_decision: 'PASS',
    review_feedback: '',
    revision_count: 0,
  };

  if (typeof payload === 'string') {
    return {
      ...defaultState,
      final_output: payload,
    };
  }

  if (payload && typeof payload === 'object') {
    const maybeState = payload as Partial<AgentState>;
    if (typeof maybeState.final_output === 'string') {
      return {
        ...defaultState,
        ...maybeState,
        user_query: maybeState.user_query || query,
      };
    }

    return {
      ...defaultState,
      final_output: JSON.stringify(payload, null, 2),
    };
  }

  return {
    ...defaultState,
    final_output: String(payload ?? ''),
  };
}

export function streamResearch(query: string, callbacks: StreamCallbacks): () => void {
  const controller = new AbortController();
  let stopped = false;
  let index = 0;

  const logInterval = setInterval(() => {
    if (stopped) return;
    if (index < REQUEST_PROGRESS_LOGS.length) {
      callbacks.onLog(REQUEST_PROGRESS_LOGS[index]);
      index += 1;
    }
  }, 400);

  const url = `${API_BASE_URL}${API_ROUTES.runResearch}`;

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: controller.signal,
  })
    .then(async (response) => {
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error('Research request failed');
      }

      const data = (payload as { result?: unknown; response?: unknown; message?: unknown } | null) ?? {};
      const resultPayload = data.result ?? data.response ?? data.message ?? payload;
      return normalizeAgentState(query, resultPayload);
    })
    .then((state) => {
      if (stopped) return;
      callbacks.onComplete(state);
    })
    .catch((error: unknown) => {
      if (stopped) return;
      if ((error as { name?: string })?.name === 'AbortError') {
        return;
      }
      callbacks.onError((error as Error).message || 'Research request failed');
    })
    .finally(() => {
      clearInterval(logInterval);
    });

  return () => {
    stopped = true;
    clearInterval(logInterval);
    controller.abort();
  };
}
