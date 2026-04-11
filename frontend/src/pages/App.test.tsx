import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

vi.mock('../services/researchApi', () => ({
  streamResearch: vi.fn(() => () => {}),
}));

vi.mock('../services/authApi', () => ({
  validateBackendSession: vi.fn(async () => ({
    authenticated: true,
    username: 'test@example.com',
    user: {
      username: 'test@example.com',
      email: 'test@example.com',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
    },
  })),
  logoutFromBackend: vi.fn(async () => undefined),
  updateUserProfile: vi.fn(async (displayName: string) => ({
    username: 'test@example.com',
    email: 'test@example.com',
    display_name: displayName,
    created_at: new Date().toISOString(),
  })),
  fetchCurrentUserProfile: vi.fn(),
}));

describe('App routing guards', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('redirects unauthenticated users to the auth page', () => {
    render(<App />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/auth');
  });

  it('redirects authenticated users away from the auth page', () => {
    localStorage.setItem('auth_user', JSON.stringify({ email: 'test@example.com' }));
    localStorage.setItem('auth_token', 'token');
    window.history.pushState({}, '', '/auth');

    render(<App />);

    expect(screen.getByTestId('main-area')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });
});