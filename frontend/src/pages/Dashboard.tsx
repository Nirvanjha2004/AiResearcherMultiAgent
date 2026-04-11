import { useEffect, useRef } from 'react';
import { useResearch } from '../hooks/useResearch';
import { useSessions } from '../hooks/useSessions';
import { useAuth } from '../context/AuthContext';
import { Session } from '../types';
import { ChatLayout } from '../components/chat/ChatLayout';

export function Dashboard() {
  const { uiState, agentState, currentQuery, logLines, startResearch, resetToIdle, loadSession } =
    useResearch();
  const { sessions, addSession, activeSessionId, setActiveSessionId } = useSessions();
  const { user, logout } = useAuth();
  const lastSavedSignatureRef = useRef<string>('');

  useEffect(() => {
    if (uiState !== 'success' || !agentState || !currentQuery) {
      return;
    }

    const signature = `${currentQuery}::${agentState.final_output}`;
    if (lastSavedSignatureRef.current === signature) {
      return;
    }

    const existing = sessions.find(
      (session) =>
        session.query === currentQuery &&
        session.result === agentState.final_output,
    );

    if (existing) {
      setActiveSessionId(existing.id);
      lastSavedSignatureRef.current = signature;
      return;
    }

    const newSession: Session = {
      id: `session-${Date.now()}`,
      query: currentQuery,
      result: agentState.final_output,
      createdAt: new Date().toISOString(),
      agentState,
    };

    addSession(newSession);
    setActiveSessionId(newSession.id);
    lastSavedSignatureRef.current = signature;
  }, [uiState, agentState, currentQuery, sessions, addSession, setActiveSessionId]);

  function handleSessionClick(session: Session) {
    loadSession(session);
    setActiveSessionId(session.id);
  }

  function handleNewChat() {
    resetToIdle();
    setActiveSessionId(null);
  }

  return (
    <ChatLayout
      uiState={uiState}
      currentQuery={currentQuery}
      agentState={agentState}
      logLines={logLines}
      sessions={sessions}
      activeSessionId={activeSessionId}
      onSelectSession={handleSessionClick}
      onNewChat={handleNewChat}
      onSendMessage={startResearch}
      userEmail={user?.email ?? 'guest@example.com'}
      userDisplayName={user?.name ?? user?.email ?? 'Workspace User'}
      onLogout={logout}
      testIdMainArea="main-area"
      testIdSidebar="sidebar"
    />
  );
}
