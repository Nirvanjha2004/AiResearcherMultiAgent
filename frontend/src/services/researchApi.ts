import { API_BASE_URL } from '../config/api';
import { AgentState } from '../types';

export interface StreamCallbacks {
  onLog: (line: string) => void;
  onComplete: (agentState: AgentState) => void;
  onError: (message: string) => void;
}

const MOCK_LOG_LINES = [
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

function runMockStreaming(query: string, callbacks: StreamCallbacks): () => void {
  let index = 0;
  const interval = setInterval(() => {
    if (index < MOCK_LOG_LINES.length) {
      callbacks.onLog(MOCK_LOG_LINES[index]);
      index++;
    } else {
      clearInterval(interval);
      const mockState: AgentState = {
        user_query: query,
        subqueries: ['sub-query 1', 'sub-query 2'],
        raw_data: ['Raw data for sub-query 1', 'Raw data for sub-query 2'],
        final_output: `# Research Report\n\nThis is a mock research report for: **${query}**\n\n## Findings\n\nMock findings here.\n\n## Conclusion\n\nMock conclusion.`,
        review_decision: 'PASS',
        review_feedback: '',
        revision_count: 0,
      };
      callbacks.onComplete(mockState);
    }
  }, 400);

  return () => clearInterval(interval);
}

export function streamResearch(query: string, callbacks: StreamCallbacks): () => void {
  let cleanup: (() => void) | null = null;

  try {
    const url = `${API_BASE_URL}/research/stream?query=${encodeURIComponent(query)}`;
    const eventSource = new EventSource(url);

    cleanup = () => eventSource.close();

    eventSource.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as { type: string; line?: string; agentState?: AgentState; message?: string };

        if (data.type === 'log' && data.line !== undefined) {
          callbacks.onLog(data.line);
        } else if (data.type === 'complete' && data.agentState !== undefined) {
          eventSource.close();
          callbacks.onComplete(data.agentState);
        } else if (data.type === 'error' && data.message !== undefined) {
          eventSource.close();
          callbacks.onError(data.message);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
      cleanup = runMockStreaming(query, callbacks);
    };
  } catch {
    cleanup = runMockStreaming(query, callbacks);
  }

  return () => {
    if (cleanup) cleanup();
  };
}
