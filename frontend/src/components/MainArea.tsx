import { AnimatePresence, motion } from 'framer-motion';
import { fadeUpVariant, scaleInVariant } from '../lib/animations';
import { UIState, AgentState } from '../types';
import { QueryInput } from './QueryInput';
import { LogPanel } from './LogPanel';
import { ResultViewer } from './ResultViewer';
import { ErrorPanel } from './ErrorPanel';

interface MainAreaProps {
  uiState: UIState;
  logLines: string[];
  agentState: AgentState | null;
  currentQuery: string;
  onStartResearch: (query: string) => void;
  onReset: () => void;
}

const variantForState = (state: UIState) => {
  if (state === 'success') return scaleInVariant;
  return fadeUpVariant;
};

export function MainArea({
  uiState,
  logLines,
  agentState,
  currentQuery,
  onStartResearch,
  onReset,
}: MainAreaProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
      <AnimatePresence mode="wait">
        {uiState === 'idle' && (
          <motion.div
            key="idle"
            variants={fadeUpVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-2xl"
          >
            <QueryInput onSubmit={onStartResearch} initialQuery={currentQuery} />
          </motion.div>
        )}

        {uiState === 'loading' && (
          <motion.div
            key="loading"
            variants={fadeUpVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-2xl"
          >
            <LogPanel lines={logLines} isLoading={true} />
          </motion.div>
        )}

        {uiState === 'success' && (
          <motion.div
            key="success"
            variants={variantForState('success')}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-3xl"
          >
            <ResultViewer
              markdown={agentState?.final_output ?? ''}
              onNewResearch={onReset}
            />
          </motion.div>
        )}

        {uiState === 'error' && (
          <motion.div
            key="error"
            variants={fadeUpVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-2xl"
          >
            <ErrorPanel
              message="An error occurred during the research run."
              previousQuery={currentQuery}
              onRetry={onReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
