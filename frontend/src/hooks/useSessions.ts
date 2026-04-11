import { useState, useCallback, useEffect } from 'react';
import { Session } from '../types';
import { fetchSessionsFromBackend, saveSessionToBackend } from '../services/sessionsApi';

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

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const backendSessions = await fetchSessionsFromBackend();
        if (!mounted) return;

        setSessions(backendSessions);
        saveSessions(backendSessions);
      } catch {
        // Keep local cache if backend sync is unavailable.
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const addSession = useCallback((session: Session) => {
    setSessions(prev => {
      const withoutDuplicate = prev.filter(existing => existing.id !== session.id);
      const updated = [session, ...withoutDuplicate];
      saveSessions(updated);
      return updated;
    });

    void saveSessionToBackend(session).catch(() => {
      // Keep local session state if backend write fails.
    });
  }, []);

  return { sessions, addSession, activeSessionId, setActiveSessionId };
}
