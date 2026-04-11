import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { trackExportEvent } from '../../services/exportTrackingApi';
import { cn } from '../../lib/utils';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export function MessageBubble({ role, content, createdAt }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === 'user';

  const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
    code: ({ children }) => (
      <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs text-cyan-300">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="mb-2 overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs">
        {children}
      </pre>
    ),
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);

      void trackExportEvent({
        action: 'copy',
        status: 'success',
        source: 'chat_message_bubble',
        format: 'markdown',
        content_length: content.length,
      });
    } catch (error) {
      void trackExportEvent({
        action: 'copy',
        status: 'failed',
        source: 'chat_message_bubble',
        format: 'markdown',
        content_length: content.length,
        error: error instanceof Error ? error.message : 'Copy failed',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('group flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'relative max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm md:max-w-[78%]',
          isUser
            ? 'border-indigo-400/30 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 text-zinc-100'
            : 'border-zinc-800 bg-zinc-900/80 text-zinc-100 backdrop-blur-xl',
        )}
      >
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-lg border border-zinc-700/70 bg-zinc-900/70 p-1.5 text-zinc-300 opacity-0 transition duration-150 hover:text-white group-hover:opacity-100"
          aria-label="Copy message"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>

        <div className={cn('pr-8 text-sm leading-relaxed', isUser ? 'text-zinc-100' : 'text-zinc-200')}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <ReactMarkdown components={markdownComponents}>
              {content}
            </ReactMarkdown>
          )}
        </div>

        {createdAt && (
          <p className="mt-2 text-[11px] text-zinc-500">
            {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
