// UI state machine
export type UIState = 'idle' | 'loading' | 'success' | 'error';

// Matches backend AgentState schema
export interface AgentState {
  user_query: string;
  subqueries: string[];
  raw_data: string[];
  final_output: string;
  review_decision: string;
  review_feedback: string;
  revision_count: number;
}

// A persisted research session
export interface Session {
  id: string;
  query: string;
  result: string;        // final_output markdown
  createdAt: string;     // ISO timestamp
  agentState: AgentState;
}

// useResearch hook return shape
export interface UseResearchReturn {
  uiState: UIState;
  logLines: string[];
  agentState: AgentState | null;
  currentQuery: string;
  startResearch: (query: string) => void;
  resetToIdle: () => void;
  loadSession: (session: Session) => void;
}

