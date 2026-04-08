import { useResearch } from '../hooks/useResearch';
import { useSessions } from '../hooks/useSessions';
import { ThemeToggle } from '../components/ThemeToggle';
import { MainArea } from '../components/MainArea';
import { useAuth } from '../context/AuthContext';
import { Session } from '../types';

export function Dashboard() {
  const { uiState, agentState, currentQuery, logLines, startResearch, resetToIdle, loadSession } =
    useResearch();
  const { sessions, addSession, activeSessionId, setActiveSessionId } = useSessions();
  const { user, logout } = useAuth();

  function handleSessionClick(session: Session) {
    loadSession(session);
    setActiveSessionId(session.id);
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className="w-64 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      >
        {/* New Research button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={resetToIdle}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-sm font-medium transition-colors duration-150"
          >
            + New Research
          </button>
        </div>

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              data-testid={`session-item-${session.id}`}
              onClick={() => handleSessionClick(session)}
              className={[
                'w-full text-left px-3 py-2 rounded-xl text-sm truncate transition-all duration-200 ease-in-out',
                activeSessionId === session.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02]',
              ].join(' ')}
            >
              {session.query}
            </button>
          ))}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user?.email ?? 'Guest'}
          </span>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-150 ml-2 flex-shrink-0"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-end px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <ThemeToggle />
        </header>

        {/* Content */}
        <main
          data-testid="main-area"
          className="flex-1 overflow-hidden flex"
        >
          <MainArea
            uiState={uiState}
            logLines={logLines}
            agentState={agentState}
            currentQuery={currentQuery}
            onStartResearch={startResearch}
            onReset={resetToIdle}
          />
        </main>
      </div>
    </div>
  );
}
