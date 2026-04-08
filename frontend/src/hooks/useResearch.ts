import { useState, useCallback, useRef } from 'react';
import { UIState, AgentState, Session, UseResearchReturn } from '../types';
import { streamResearch } from '../services/researchApi';

export function useResearch(): UseResearchReturn {
  const [uiState, setUiState] = useState<UIState>('idle');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const cleanupRef = useRef<(() => void) | null>(null);

  const startResearch = useCallback((query: string) => {
    // Cleanup any previous stream
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    setCurrentQuery(query);
    setLogLines([]);
    setAgentState(null);
    setUiState('loading');

    const cleanup = streamResearch(query, {
      onLog: (line) => {
        setLogLines(prev => [...prev, line]);
      },
      onComplete: (state) => {
        setAgentState(state);
        setUiState('success');
        cleanupRef.current = null;
      },
      onError: (message) => {
        console.error('Research stream error:', message);
        setUiState('error');
        cleanupRef.current = null;
      },
    });

    cleanupRef.current = cleanup;
  }, []);

  const resetToIdle = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setUiState('idle');
    setLogLines([]);
    setAgentState(null);
  }, []);

  const loadSession = useCallback((session: Session) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setCurrentQuery(session.query);
    setAgentState(session.agentState);
    setLogLines([]);
    setUiState('success');
  }, []);

  return { uiState, logLines, agentState, currentQuery, startResearch, resetToIdle, loadSession };
}
