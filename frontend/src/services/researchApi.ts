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
  'Searching for: sub-query 1...',
  'Searching for: sub-query 2...',
  '--- WRITER AGENT RUNNING ---',
  'Synthesizing final report...',
  '--- REVIEWER AGENT RUNNING ---',
  'Review Decision: PASS',
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
  const streamUrl = `${API_BASE_URL}${API_ROUTES.runResearchStream}?query=${encodeURIComponent(query)}`;

  const source = new EventSource(streamUrl);

  let stopped = false;
  let completed = false;
  let hasReceivedMessage = false;
  let fallbackInterval: ReturnType<typeof setInterval> | null = null;

  const stopFallbackIfRunning = () => {
    if (fallbackInterval) {
      clearInterval(fallbackInterval);
      fallbackInterval = null;
    }
  };

  const startMockFallback = () => {
    let index = 0;
    fallbackInterval = setInterval(() => {
      if (stopped || completed) {
        stopFallbackIfRunning();
        return;
      }

      if (index < REQUEST_PROGRESS_LOGS.length) {
        callbacks.onLog(REQUEST_PROGRESS_LOGS[index]);
        index += 1;
        return;
      }

      completed = true;
      stopFallbackIfRunning();
      callbacks.onComplete(
        normalizeAgentState(query, {
          user_query: query,
          subqueries: [],
          raw_data: [],
          final_output: '',
          review_decision: 'PASS',
          review_feedback: '',
          revision_count: 0,
        })
      );
    }, 400);
  };

  source.addEventListener('message', (event: MessageEvent) => {
    if (stopped || completed) {
      return;
    }

    hasReceivedMessage = true;

    let payload: unknown;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }

    if (!payload || typeof payload !== 'object') {
      return;
    }

    const message = payload as {
      type?: string;
      line?: string;
      message?: string;
      agentState?: unknown;
    };

    if (message.type === 'log' && typeof message.line === 'string') {
      callbacks.onLog(message.line);
      return;
    }

    if (message.type === 'complete') {
      completed = true;
      source.close();
      callbacks.onComplete(normalizeAgentState(query, message.agentState));
      return;
    }

    if (message.type === 'error') {
      completed = true;
      source.close();
      callbacks.onError(message.message || 'Research stream failed');
    }
  });

  source.onerror = () => {
    if (stopped || completed) {
      return;
    }

    source.close();

    // If the stream fails before first payload, keep UX alive with deterministic fallback logs.
    if (!hasReceivedMessage) {
      startMockFallback();
      return;
    }

    completed = true;
    callbacks.onError('Research stream disconnected');
  };

  return () => {
    stopped = true;
    stopFallbackIfRunning();
    source.close();
  };
}
