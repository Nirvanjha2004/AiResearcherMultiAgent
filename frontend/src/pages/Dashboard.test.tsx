import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';

// Mock researchApi to avoid real SSE connections
vi.mock('../services/researchApi', () => ({
  streamResearch: vi.fn(() => () => {}),
}));

// Seed localStorage with a session for session-related tests
const MOCK_SESSION = {
  id: 'session-1',
  query: 'What is quantum computing?',
  result: '# Quantum Computing\nSome content.',
  createdAt: new Date().toISOString(),
  agentState: {
    user_query: 'What is quantum computing?',
    subqueries: [],
    raw_data: [],
    final_output: '# Quantum Computing\nSome content.',
    review_decision: 'PASS',
    review_feedback: '',
    revision_count: 0,
  },
};

function renderDashboard() {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <Dashboard />
      </ThemeProvider>
    </AuthProvider>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders sidebar and main area', () => {
    renderDashboard();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-area')).toBeInTheDocument();
  });

  it('renders the "+ New Research" button in the sidebar', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /new research/i })).toBeInTheDocument();
  });

  it('renders the dark mode toggle button', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('toggles dark mode when theme toggle is clicked', () => {
    renderDashboard();
    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    fireEvent.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    // Toggle back
    const toggleBack = screen.getByRole('button', { name: /switch to light mode/i });
    fireEvent.click(toggleBack);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('renders session items from localStorage', () => {
    localStorage.setItem('research_sessions', JSON.stringify([MOCK_SESSION]));
    renderDashboard();
    expect(screen.getByText('What is quantum computing?')).toBeInTheDocument();
  });

  it('highlights the active session after clicking it', () => {
    localStorage.setItem('research_sessions', JSON.stringify([MOCK_SESSION]));
    renderDashboard();
    const sessionBtn = screen.getByTestId('session-item-session-1');
    fireEvent.click(sessionBtn);
    // Active session gets indigo styling class
    expect(sessionBtn.className).toMatch(/indigo/);
  });

  it('clicking "+ New Research" is present and clickable', () => {
    renderDashboard();
    const btn = screen.getByRole('button', { name: /new research/i });
    fireEvent.click(btn); // should not throw
    expect(screen.getByTestId('main-area')).toBeInTheDocument();
  });
});
