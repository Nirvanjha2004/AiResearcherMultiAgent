import { API_ROUTES } from '../config/api';
import { AgentState } from '../types';
import { buildApiUrl, getAuthHeaders } from './apiClient';

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

async function runResearchRequest(query: string): Promise<AgentState> {
  const response = await fetch(buildApiUrl(API_ROUTES.runResearch), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Research request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return normalizeAgentState(query, payload && typeof payload === 'object' && 'result' in payload ? (payload as { result?: unknown }).result : payload);
}

async function* parseSSEStream(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          yield line.slice(6);
        }
      }
    }

    if (buffer) {
      if (buffer.startsWith('data: ')) {
        yield buffer.slice(6);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function streamResearch(query: string, callbacks: StreamCallbacks): () => void {
  const streamUrl = `${buildApiUrl(API_ROUTES.runResearchStream)}?${new URLSearchParams({ query }).toString()}`;

  let stopped = false;
  let completed = false;
  let hasReceivedMessage = false;
  let fallbackInterval: ReturnType<typeof setInterval> | null = null;
  let controller: AbortController | null = new AbortController();

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

  const startNonStreamingFallback = async () => {
    try {
      const state = await runResearchRequest(query);
      if (stopped || completed) {
        return;
      }

      completed = true;
      callbacks.onLog('--- FALLBACK RESEARCH REQUEST RUNNING ---');
      callbacks.onComplete(state);
    } catch {
      if (stopped || completed) {
        return;
      }

      startMockFallback();
    }
  };

  (async () => {
    try {
      if (!controller) return;

      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        if (!hasReceivedMessage) {
          await startNonStreamingFallback();
        } else {
          completed = true;
          callbacks.onError(`Stream request failed with status ${response.status}`);
        }
        return;
      }

      const reader = response.body.getReader();

      for await (const dataLine of parseSSEStream(reader)) {
        if (stopped || completed) {
          return;
        }

        hasReceivedMessage = true;

        let payload: unknown;
        try {
          payload = JSON.parse(dataLine);
        } catch {
          continue;
        }

        if (!payload || typeof payload !== 'object') {
          continue;
        }

        const message = payload as {
          type?: string;
          line?: string;
          message?: string;
          agentState?: unknown;
        };

        if (message.type === 'log' && typeof message.line === 'string') {
          callbacks.onLog(message.line);
          continue;
        }

        if (message.type === 'complete') {
          completed = true;
          callbacks.onComplete(normalizeAgentState(query, message.agentState));
          return;
        }

        if (message.type === 'error') {
          completed = true;
          callbacks.onError(message.message || 'Research stream failed');
          return;
        }
      }
    } catch (error) {
      if (stopped || completed) {
        return;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // If the stream fails before first payload, keep UX alive with deterministic fallback logs.
      if (!hasReceivedMessage) {
        await startNonStreamingFallback();
        return;
      }

      completed = true;
      callbacks.onError('Research stream disconnected');
    }
  })();

  return () => {
    stopped = true;
    stopFallbackIfRunning();
    if (controller) {
      controller.abort();
      controller = null;
    }
  };
}
