import { useState, useCallback } from 'react';
import { Session } from '../types';

const STORAGE_KEY = 'research_sessions';

function loadSessions(): Session[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const addSession = useCallback((session: Session) => {
    setSessions(prev => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
  }, []);

  return { sessions, addSession, activeSessionId, setActiveSessionId };
}
