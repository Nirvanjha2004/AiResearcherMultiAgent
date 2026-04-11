import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Command } from 'lucide-react';
import { Session, UIState, AgentState } from '../../types';
import { ThemeToggle } from '../ThemeToggle';
import { BackgroundBeams } from '../ui/background-beams';
import { Spotlight } from '../ui/spotlight';
import { ChatInput } from './ChatInput';
import { ChatWindow, ChatMessage } from './ChatWindow';
import { Sidebar } from './Sidebar';
import { cn } from '../../lib/utils';

interface ChatLayoutProps {
  uiState: UIState;
  currentQuery: string;
  agentState: AgentState | null;
  logLines: string[];
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (session: Session) => void;
  onNewChat: () => void;
  onSendMessage: (query: string) => void;
  userEmail: string;
  onLogout: () => void;
  testIdMainArea?: string;
  testIdSidebar?: string;
}

function buildMessages(uiState: UIState, currentQuery: string, agentState: AgentState | null): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const now = new Date().toISOString();

  if (currentQuery) {
    messages.push({
      id: `user-${currentQuery}-${now}`,
      role: 'user',
      content: currentQuery,
      createdAt: now,
    });
  }

  if (uiState === 'success' && agentState) {
    messages.push({
      id: `assistant-${agentState.final_output.length}-${now}`,
      role: 'assistant',
      content: agentState.final_output,
      createdAt: now,
    });
  }

  if (uiState === 'error') {
    messages.push({
      id: `assistant-error-${now}`,
      role: 'assistant',
      content: 'Something went wrong while processing your request. Please try again.',
      createdAt: now,
    });
  }

  return messages;
}

export function ChatLayout({
  uiState,
  currentQuery,
  agentState,
  logLines,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onSendMessage,
  userEmail,
  onLogout,
  testIdMainArea,
  testIdSidebar,
}: ChatLayoutProps) {
  const [searchValue, setSearchValue] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }

      if (event.key === 'Escape') {
        setPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const messages = useMemo(
    () => buildMessages(uiState, currentQuery, agentState),
    [uiState, currentQuery, agentState],
  );

  const title = currentQuery ? currentQuery : 'New Chat';
  const subtitle = uiState === 'loading' ? 'Generating response...' : 'SaaS Research Assistant';

  const quickSwitchItems = sessions.filter((session) =>
    session.query.toLowerCase().includes(searchValue.toLowerCase()),
  );

  return (
    <div className="relative h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Spotlight />
      <BackgroundBeams />

      <div className="relative z-10 grid h-full grid-cols-1 lg:grid-cols-[320px_1fr]">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSelectSession={onSelectSession}
          onNewChat={onNewChat}
          onOpenPalette={() => setPaletteOpen(true)}
          userEmail={userEmail}
          onLogout={onLogout}
          testId={testIdSidebar}
        />

        <section className="relative flex min-h-0 flex-col" data-testid={testIdMainArea}>
          <div className="absolute right-4 top-3 z-20">
            <ThemeToggle />
          </div>

          <ChatWindow
            title={title}
            subtitle={subtitle}
            messages={messages}
            isLoading={uiState === 'loading'}
            loadingLogs={logLines}
          />

          <ChatInput
            onSend={onSendMessage}
            disabled={uiState === 'loading'}
            initialValue={uiState === 'idle' ? currentQuery : ''}
          />
        </section>
      </div>

      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/45 p-4 backdrop-blur-sm"
            onClick={() => setPaletteOpen(false)}
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mx-auto mt-16 w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900/95 p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
                <Command size={16} className="text-cyan-400" />
                Command Palette
              </div>

              <input
                autoFocus
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search conversations"
                className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
              />

              <div className="saas-scrollbar max-h-80 space-y-2 overflow-y-auto">
                {quickSwitchItems.length === 0 ? (
                  <p className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-500">No chats found.</p>
                ) : (
                  quickSwitchItems.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        onSelectSession(session);
                        setPaletteOpen(false);
                      }}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
                        activeSessionId === session.id
                          ? 'border-cyan-500/60 bg-cyan-500/10 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700',
                      )}
                    >
                      <p className="line-clamp-1">{session.query}</p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
