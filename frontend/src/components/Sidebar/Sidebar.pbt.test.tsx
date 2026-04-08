// Feature: multi-agent-research-platform-ui, Property 4: clicking any session item shows that session's result

/**
 * Validates: Requirements 2.4
 *
 * Property 4: Session loading always shows correct result
 * For any session in the session history list, clicking that session item SHALL
 * call `loadSession` with that session and `setActiveSessionId` with that session's id.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { Sidebar } from './Sidebar';

// Mock hooks
vi.mock('../../hooks/useResearch');
vi.mock('../../hooks/useSessions');
vi.mock('../../context/AuthContext');

import { useResearch } from '../../hooks/useResearch';
import { useSessions } from '../../hooks/useSessions';
import { useAuth } from '../../context/AuthContext';

const mockUseResearch = vi.mocked(useResearch);
const mockUseSessions = vi.mocked(useSessions);
const mockUseAuth = vi.mocked(useAuth);

function makeAgentState() {
  return {
    user_query: '',
    subqueries: [],
    raw_data: [],
    final_output: '',
    review_decision: '',
    review_feedback: '',
    revision_count: 0,
  };
}

describe('Sidebar PBT — Property 4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      token: 'tok',
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('clicking any session item calls loadSession with that session and setActiveSessionId with its id', async () => {
    const sessionArb = fc.record({
      id: fc.uuid(),
      query: fc.string({ minLength: 1, maxLength: 80 }),
      result: fc.string(),
      createdAt: fc.constant(new Date().toISOString()),
      agentState: fc.constant(makeAgentState()),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(sessionArb, { minLength: 1, maxLength: 10 }),
        fc.nat(),
        async (sessions, indexSeed) => {
          const targetIndex = indexSeed % sessions.length;
          const targetSession = sessions[targetIndex];

          const loadSession = vi.fn();
          const setActiveSessionId = vi.fn();

          mockUseResearch.mockReturnValue({
            uiState: 'idle',
            logLines: [],
            agentState: null,
            currentQuery: '',
            startResearch: vi.fn(),
            resetToIdle: vi.fn(),
            loadSession,
          });

          mockUseSessions.mockReturnValue({
            sessions,
            addSession: vi.fn(),
            activeSessionId: null,
            setActiveSessionId,
          });

          const { unmount } = render(<Sidebar />);

          const btn = screen.getByTestId(`session-item-${targetSession.id}`);
          await userEvent.click(btn);

          expect(loadSession).toHaveBeenCalledWith(targetSession);
          expect(setActiveSessionId).toHaveBeenCalledWith(targetSession.id);

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
