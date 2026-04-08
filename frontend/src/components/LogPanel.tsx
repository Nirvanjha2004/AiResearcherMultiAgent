import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logLineVariant } from '../lib/animations';
import { LogPanelProps } from '../types';

export function LogPanel({ lines, isLoading }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines are appended
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Indeterminate progress bar at top while loading */}
      {isLoading && (
        <div
          data-testid="progress-bar"
          className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 overflow-hidden"
          aria-label="Loading progress"
        >
          <div className="h-full bg-blue-500 dark:bg-blue-400 animate-[indeterminate_1.5s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Log content area */}
      <div
        ref={scrollRef}
        className="font-mono text-sm bg-gray-100 dark:bg-gray-800 rounded-2xl max-h-96 overflow-y-scroll p-4 space-y-0.5"
      >
        <AnimatePresence initial={false}>
          {lines.map((line, index) => (
            <motion.div
              key={index}
              variants={logLineVariant}
              initial="hidden"
              animate="visible"
              className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Blinking cursor after last line while loading */}
        {isLoading && (
          <span
            data-testid="blinking-cursor"
            className="inline-block w-2 h-4 bg-gray-600 dark:bg-gray-400 animate-pulse align-middle"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
