import { useResearch } from '../../hooks/useResearch';
import { useSessions } from '../../hooks/useSessions';
import { useAuth } from '../../context/AuthContext';
import { Session } from '../../types';
import { SessionItem } from './SessionItem';

export function Sidebar() {
  const { resetToIdle, loadSession } = useResearch();
  const { sessions, activeSessionId, setActiveSessionId } = useSessions();
  const { user, logout } = useAuth();

  function handleSessionClick(session: Session) {
    loadSession(session);
    setActiveSessionId(session.id);
  }

  return (
    <aside
      data-testid="sidebar"
      className="w-64 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
    >
      {/* New Research button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          data-testid="new-research-button"
          onClick={resetToIdle}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-sm font-medium transition-colors duration-150"
        >
          + New Research
        </button>
      </div>

      {/* Session list */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map(session => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={activeSessionId === session.id}
            onClick={handleSessionClick}
          />
        ))}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {user?.email ?? 'Guest'}
        </span>
        <button
          data-testid="sign-out-button"
          onClick={logout}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-150 ml-2 flex-shrink-0"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
