import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { fadeUpVariant, buttonHover, buttonTap } from '../lib/animations';
import { ErrorPanelProps } from '../types';

export function ErrorPanel({ message, previousQuery, onRetry }: ErrorPanelProps) {
  return (
    <motion.div
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle size={20} />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Research failed</h2>
            <p role="alert" className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {message}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Previous query
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
              {previousQuery || 'No previous query available.'}
            </p>
          </div>

          <motion.button
            type="button"
            onClick={onRetry}
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            aria-label="Try again"
          >
            <RotateCcw size={15} />
            <span>Try Again</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
