// Feature: multi-agent-research-platform-ui, Property 8: any SSE event sequence routes correctly to callbacks

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { streamResearch } from './researchApi';
import type { StreamCallbacks } from './researchApi';
import type { AgentState } from '../types';

const mockAgentState: AgentState = {
  user_query: 'test',
  subqueries: [],
  raw_data: [],
  final_output: '# Report',
  review_decision: 'PASS',
  review_feedback: '',
  revision_count: 0,
};

class ControllableMockEventSource {
  static instance: ControllableMockEventSource | null = null;
  private listeners: Map<string, ((e: MessageEvent) => void)[]> = new Map();
  onerror: (() => void) | null = null;
  close = vi.fn();

  constructor() {
    ControllableMockEventSource.instance = this;
  }

  addEventListener(type: string, handler: (e: MessageEvent) => void) {
    const existing = this.listeners.get(type) ?? [];
    this.listeners.set(type, [...existing, handler]);
  }

  fireMessage(data: unknown) {
    const handlers = this.listeners.get('message') ?? [];
    const event = { data: JSON.stringify(data) } as MessageEvent;
    handlers.forEach(h => h(event));
  }
}

describe('researchApi PBT', () => {
  beforeEach(() => {
    ControllableMockEventSource.instance = null;
    vi.stubGlobal('EventSource', ControllableMockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Property 8: any SSE event sequence routes correctly to callbacks', () => {
    const logLineArb = fc.string({ minLength: 1, maxLength: 100 });
    const terminalArb = fc.oneof(
      fc.constant({ type: 'complete' as const }),
      fc.string({ minLength: 1 }).map(msg => ({ type: 'error' as const, message: msg }))
    );

    fc.assert(
      fc.property(
        fc.array(logLineArb, { minLength: 0, maxLength: 10 }),
        terminalArb,
        (logLines, terminal) => {
          const onLog = vi.fn();
          const onComplete = vi.fn();
          const onError = vi.fn();
          const callbacks: StreamCallbacks = { onLog, onComplete, onError };

          streamResearch('test', callbacks);

          const source = ControllableMockEventSource.instance!;

          logLines.forEach(line => {
            source.fireMessage({ type: 'log', line });
          });

          if (terminal.type === 'complete') {
            source.fireMessage({ type: 'complete', agentState: mockAgentState });
          } else {
            source.fireMessage({ type: 'error', message: terminal.message });
          }

          expect(onLog).toHaveBeenCalledTimes(logLines.length);
          logLines.forEach((line, i) => {
            expect(onLog).toHaveBeenNthCalledWith(i + 1, line);
          });

          if (terminal.type === 'complete') {
            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();
          } else {
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onComplete).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
