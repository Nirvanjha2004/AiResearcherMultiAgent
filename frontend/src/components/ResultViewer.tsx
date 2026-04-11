import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { scaleInVariant, staggerContainer, fadeUpVariant } from '../lib/animations';
import { ResultViewerProps } from '../types';
import { FloatingActionBar } from './FloatingActionBar';

export function ResultViewer({ markdown, onNewResearch, sessionId }: ResultViewerProps) {
  return (
    <motion.div
      variants={scaleInVariant}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm"
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <motion.h1 variants={fadeUpVariant} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-2">
                {children}
              </motion.h1>
            ),
            h2: ({ children }) => (
              <motion.h2 variants={fadeUpVariant} className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-4">
                {children}
              </motion.h2>
            ),
            h3: ({ children }) => (
              <motion.h3 variants={fadeUpVariant} className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-3">
                {children}
              </motion.h3>
            ),
            h4: ({ children }) => (
              <motion.h4 variants={fadeUpVariant} className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-3">
                {children}
              </motion.h4>
            ),
            h5: ({ children }) => (
              <motion.h5 variants={fadeUpVariant} className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-2">
                {children}
              </motion.h5>
            ),
            h6: ({ children }) => (
              <motion.h6 variants={fadeUpVariant} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">
                {children}
              </motion.h6>
            ),
            p: ({ children }) => (
              <motion.p variants={fadeUpVariant} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                {children}
              </motion.p>
            ),
            ul: ({ children }) => (
              <motion.ul variants={fadeUpVariant} className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-3 space-y-1 pl-2">
                {children}
              </motion.ul>
            ),
            ol: ({ children }) => (
              <motion.ol variants={fadeUpVariant} className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-3 space-y-1 pl-2">
                {children}
              </motion.ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-700 dark:text-gray-300">
                {children}
              </li>
            ),
            pre: ({ children }) => (
              <motion.pre variants={fadeUpVariant} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-3 overflow-x-auto text-sm font-mono">
                {children}
              </motion.pre>
            ),
            code: ({ children, className }) => {
              const isBlock = !!className;
              return isBlock ? (
                <code className={`${className} text-gray-800 dark:text-gray-200`}>{children}</code>
              ) : (
                <code className="bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </motion.div>

      <FloatingActionBar markdown={markdown} onNewResearch={onNewResearch} sessionId={sessionId} />
    </motion.div>
  );
}
