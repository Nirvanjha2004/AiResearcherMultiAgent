import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, buttonHover, buttonTap } from '../lib/animations';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  initialQuery?: string;
}

export function QueryInput({ onSubmit, initialQuery = '' }: QueryInputProps) {
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (query.trim() === '') {
      setError('Please enter a research query before starting.');
      return;
    }
    setError(null);
    onSubmit(query);
  };

  return (
    <motion.div
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 w-full"
    >
      <div className="flex flex-col gap-2">
        <textarea
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Describe what you'd like to research — e.g. 'What are the latest advances in quantum computing?'"
          className="w-full min-h-[120px] resize-y rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 transition-shadow"
          aria-label="Research query"
          aria-describedby={error ? 'query-error' : undefined}
        />
        {error && (
          <p
            id="query-error"
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>

      <motion.button
        whileHover={buttonHover}
        whileTap={buttonTap}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={handleSubmit}
        className="self-end px-6 py-2.5 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
      >
        Start Research
      </motion.button>
    </motion.div>
  );
}
