import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Plus, Check } from 'lucide-react';
import { fadeUpVariant, actionButtonHover } from '../lib/animations';

interface FloatingActionBarProps {
  markdown: string;
  onNewResearch: () => void;
}

export function FloatingActionBar({ markdown, onNewResearch }: FloatingActionBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2 mt-4 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
    >
      <motion.button
        whileHover={{ ...actionButtonHover, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={handleCopy}
        data-testid="copy-button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <>
            <Check size={15} className="text-green-500" />
            <span data-testid="copy-confirmation">Copied!</span>
          </>
        ) : (
          <>
            <Copy size={15} />
            <span>Copy</span>
          </>
        )}
      </motion.button>

      <motion.button
        whileHover={{ ...actionButtonHover, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={handleDownload}
        data-testid="download-button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Download as Markdown"
      >
        <Download size={15} />
        <span>Download</span>
      </motion.button>

      <motion.button
        whileHover={{ ...actionButtonHover, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={onNewResearch}
        data-testid="new-research-button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ml-auto"
        aria-label="New Research"
      >
        <Plus size={15} />
        <span>New Research</span>
      </motion.button>
    </motion.div>
  );
}
