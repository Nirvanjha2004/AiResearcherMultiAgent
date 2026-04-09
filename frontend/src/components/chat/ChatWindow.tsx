import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatWindowProps {
  title: string;
  subtitle: string;
  messages: ChatMessage[];
  isLoading: boolean;
  loadingLogs: string[];
}

function TypingIndicator({ logs }: { logs: string[] }) {
  const latestLogs = logs.slice(-3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[80%] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-cyan-300">
        <Sparkles size={14} />
        <span>Assistant is thinking</span>
      </div>

      <div className="flex items-center gap-1.5 py-2">
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:240ms]" />
      </div>

      {latestLogs.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
          {latestLogs.map((line) => (
            <li key={line} className="line-clamp-1">
              {line}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

export function ChatWindow({ title, subtitle, messages, isLoading, loadingLogs }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, loadingLogs]);

  const hasMessages = useMemo(() => messages.length > 0 || isLoading, [messages.length, isLoading]);

  return (
    <div data-testid="main-area" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/65 px-6 py-4 backdrop-blur-xl">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-300">
          <Bot size={14} className="text-cyan-400" />
          AI Assistant
        </div>
      </header>

      <div className="saas-scrollbar flex-1 overflow-y-auto px-4 py-6 md:px-7">
        {!hasMessages ? (
          <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-cyan-300">Welcome</p>
            <h2 className="text-2xl font-semibold text-zinc-100">Start a new conversation</h2>
            <p className="mt-3 text-sm text-zinc-400">
              Ask for analysis, summaries, technical deep-dives, or multi-step research plans.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  createdAt={message.createdAt}
                />
              ))}
            </AnimatePresence>

            {isLoading && <TypingIndicator logs={loadingLogs} />}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
