import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Paperclip, SendHorizonal } from 'lucide-react';

interface ChatInputProps {
  onSend: (query: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

export function ChatInput({ onSend, disabled = false, initialValue = '' }: ChatInputProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Please enter a message to start your research.');
      return;
    }

    setError(null);
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 border-t border-zinc-800/80 bg-zinc-950/80 px-4 pb-4 pt-3 backdrop-blur-xl md:px-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-end gap-2 rounded-2xl border border-transparent bg-zinc-900/60 p-2 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_0_2px_rgba(34,211,238,0.16)]">
          <button
            type="button"
            className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything. Shift+Enter for a new line"
            rows={1}
            className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            disabled={disabled}
          />

          <button
            type="button"
            className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Use microphone"
          >
            <Mic size={16} />
          </button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={handleSubmit}
            disabled={disabled}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 p-2.5 text-white shadow-lg shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Send message"
          >
            <SendHorizonal size={16} />
          </motion.button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
