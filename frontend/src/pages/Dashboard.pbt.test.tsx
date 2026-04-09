// Feature: multi-agent-research-platform-ui, Property 3: New Research from any UI_State resets to idle

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { Dashboard } from './Dashboard';
import { ThemeProvider } from '../context/ThemeContext';

vi.mock('../hooks/useResearch');
vi.mock('../hooks/useSessions');
vi.mock('../context/AuthContext');

import { useResearch } from '../hooks/useResearch';
import { useSessions } from '../hooks/useSessions';
import { useAuth } from '../context/AuthContext';

const mockUseResearch = vi.mocked(useResearch);
const mockUseSessions = vi.mocked(useSessions);
const mockUseAuth = vi.mocked(useAuth);

describe('Dashboard — Property 3: New Research from any UI_State resets to idle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      token: 'tok',
      login: vi.fn(),
      logout: vi.fn(),
    });
    mockUseSessions.mockReturnValue({
      sessions: [],
      addSession: vi.fn(),
      activeSessionId: null,
      setActiveSessionId: vi.fn(),
    });
  });

  it('clicking New Research calls resetToIdle for any UI state', () => {
    fc.assert(
      fc.property(fc.constantFrom<'idle' | 'loading' | 'success' | 'error'>('idle', 'loading', 'success', 'error'), (uiState) => {
        const resetToIdle = vi.fn();

        mockUseResearch.mockReturnValue({
          uiState,
          logLines: [],
          agentState: null,
          currentQuery: 'Previous query',
          startResearch: vi.fn(),
          resetToIdle,
          loadSession: vi.fn(),
        });

        const { unmount } = render(
          <ThemeProvider>
            <Dashboard />
          </ThemeProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: /new research/i }));

        expect(resetToIdle).toHaveBeenCalledTimes(1);

        unmount();
      }),
      { numRuns: 50 },
    );
  });
});