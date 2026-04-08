import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LogPanel } from './LogPanel';
import { streamResearch } from '../services/researchApi';
import type { StreamCallbacks } from '../services/researchApi';

// ─── LogPanel rendering tests ────────────────────────────────────────────────

describe('LogPanel', () => {
  it('renders log lines', () => {
    render(<LogPanel lines={['line one', 'line two']} isLoading={false} />);
    expect(screen.getByText('line one')).toBeInTheDocument();
    expect(screen.getByText('line two')).toBeInTheDocument();
  });

  it('shows progress bar when isLoading is true', () => {
    render(<LogPanel lines={[]} isLoading={true} />);
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  it('hides progress bar when isLoading is false', () => {
    render(<LogPanel lines={[]} isLoading={false} />);
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('shows blinking cursor when isLoading is true', () => {
    render(<LogPanel lines={[]} isLoading={true} />);
    expect(screen.getByTestId('blinking-cursor')).toBeInTheDocument();
  });

  it('hides blinking cursor when isLoading is false', () => {
    render(<LogPanel lines={[]} isLoading={false} />);
    expect(screen.queryByTestId('blinking-cursor')).not.toBeInTheDocument();
  });

  it('renders empty state without errors', () => {
    render(<LogPanel lines={[]} isLoading={false} />);
    // Should render without throwing
  });
});

// ─── Mock streaming fallback integration ─────────────────────────────────────

// EventSource mock that immediately fires onerror to trigger fallback
class MockEventSourceError {
  onerror: (() => void) | null = null;
  addEventListener = vi.fn();
  close = vi.fn();

  constructor() {
    Promise.resolve().then(() => {
      if (this.onerror) this.onerror();
    });
  }
}

describe('LogPanel — mock streaming fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('EventSource', MockEventSourceError);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('mock streaming fallback emits log lines sequentially', async () => {
    const onLog = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();
    const callbacks: StreamCallbacks = { onLog, onComplete, onError };

    streamResearch('test query', callbacks);

    // Let onerror fire so mock streaming starts
    await Promise.resolve();

    // Advance through all 9 mock log lines
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400 * 9 + 400);
    });

    expect(onLog).toHaveBeenCalledTimes(9);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('mock streaming fallback first line is planner agent', async () => {
    const collectedLines: string[] = [];
    const callbacks: StreamCallbacks = {
      onLog: (line) => collectedLines.push(line),
      onComplete: vi.fn(),
      onError: vi.fn(),
    };

    streamResearch('test query', callbacks);
    await Promise.resolve();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(collectedLines[0]).toBe('--- PLANNER AGENT RUNNING ---');
  });
});

// ─── SSE error → error state ──────────────────────────────────────────────────

// EventSource mock that fires an error event with type 'error' via message listener
class MockEventSourceWithErrorMessage {
  onerror: (() => void) | null = null;
  private listeners: Map<string, ((e: MessageEvent) => void)[]> = new Map();

  addEventListener(type: string, handler: (e: MessageEvent) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(handler);
    // Immediately fire an error message event
    if (type === 'message') {
      Promise.resolve().then(() => {
        const errorEvent = new MessageEvent('message', {
          data: JSON.stringify({ type: 'error', message: 'Server error occurred' }),
        });
        handler(errorEvent);
      });
    }
  }

  close = vi.fn();
}

describe('LogPanel — SSE error event → error state', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', MockEventSourceWithErrorMessage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SSE error message triggers onError callback', async () => {
    const onLog = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();
    const callbacks: StreamCallbacks = { onLog, onComplete, onError };

    streamResearch('test query', callbacks);

    // Let the promise-based message fire
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith('Server error occurred');
    expect(onComplete).not.toHaveBeenCalled();
  });
});
