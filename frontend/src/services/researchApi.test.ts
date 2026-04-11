import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamResearch } from './researchApi';
import type { StreamCallbacks } from './researchApi';

// MOCK_LOG_LINES mirrored from researchApi.ts for assertion purposes
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

// EventSource mock that immediately fires onerror
class MockEventSourceError {
  static instances: MockEventSourceError[] = [];
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  addEventListener = vi.fn();
  close = vi.fn();

  constructor() {
    MockEventSourceError.instances.push(this);
    // Fire onerror asynchronously so the caller can attach the handler first
    Promise.resolve().then(() => {
      if (this.onerror) this.onerror();
    });
  }
}

describe('streamResearch', () => {
  let onLog: ReturnType<typeof vi.fn>;
  let onComplete: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;
  let callbacks: StreamCallbacks;

  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSourceError.instances = [];
    vi.stubGlobal('EventSource', MockEventSourceError);

    onLog = vi.fn();
    onComplete = vi.fn();
    onError = vi.fn();
    callbacks = { onLog, onComplete, onError };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('SSE connection error triggers mock streaming fallback', async () => {
    streamResearch('test query', callbacks);

    // Let the onerror promise resolve so mock streaming starts
    await Promise.resolve();

    // Advance through all 9 log lines (each at 400ms) + 1 more tick for onComplete
    await vi.advanceTimersByTimeAsync(400 * 9 + 400);

    expect(onLog).toHaveBeenCalledTimes(9);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ user_query: 'test query' })
    );
    expect(onError).not.toHaveBeenCalled();
  });

  it('mock streaming emits lines in correct order', async () => {
    const collectedLines: string[] = [];
    const orderCallbacks: StreamCallbacks = {
      onLog: (line) => collectedLines.push(line),
      onComplete: vi.fn(),
      onError: vi.fn(),
    };

    streamResearch('order test', orderCallbacks);
    await Promise.resolve();

    // Advance through all log lines
    await vi.advanceTimersByTimeAsync(400 * 9 + 400);

    expect(collectedLines).toEqual(MOCK_LOG_LINES);
    expect(collectedLines[0]).toBe('--- PLANNER AGENT RUNNING ---');
    expect(collectedLines[collectedLines.length - 1]).toBe('Review Decision: PASS');
  });

  it('cleanup function stops mock streaming', async () => {
    const cleanup = streamResearch('cleanup test', callbacks);

    // Let onerror fire so mock streaming starts
    await Promise.resolve();

    // Advance 2 intervals so 2 log lines are emitted
    await vi.advanceTimersByTimeAsync(400 * 2);
    expect(onLog).toHaveBeenCalledTimes(2);

    // Stop streaming
    cleanup();

    // Advance remaining time — onComplete should NOT be called
    await vi.advanceTimersByTimeAsync(400 * 8 + 400);

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('falls back to the non-streaming research endpoint when the stream has no body', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, body: null, status: 200 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            user_query: 'fallback query',
            subqueries: ['one'],
            raw_data: ['data'],
            final_output: '# Fallback Report',
            review_decision: 'PASS',
            review_feedback: '',
            revision_count: 1,
          },
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    streamResearch('fallback query', callbacks);

    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        user_query: 'fallback query',
        final_output: '# Fallback Report',
      })
    );
    expect(onError).not.toHaveBeenCalled();
  });
});
