import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AuthPage from './AuthPage';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext — default: login succeeds
const mockLogin = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, user: null, token: null, logout: vi.fn() }),
}));

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Layout ──────────────────────────────────────────────────────────────────

  it('renders split layout: branding panel and form panel', () => {
    render(<AuthPage />);
    // Branding panel content
    expect(screen.getByText(/multi-agent research platform/i)).toBeInTheDocument();
    // Form panel: heading present
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  // ── Tab switching ────────────────────────────────────────────────────────────

  it('renders Login tab as active by default', () => {
    render(<AuthPage />);
    const loginTab = screen.getByRole('button', { name: /^login$/i });
    expect(loginTab).toBeInTheDocument();
    // Login heading visible
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('switches to Sign Up tab when clicked', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByText(/create account/i)).toBeInTheDocument();
  });

  it('switching tabs clears any existing auth error', () => {
    render(<AuthPage />);
    // Trigger an auth error by submitting valid login form with a throwing login mock
    mockLogin.mockImplementationOnce(() => { throw new Error('Login failed'); });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Switch tab — error should disappear
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ── Field presence ───────────────────────────────────────────────────────────

  it('Login form has email and password fields but no confirm-password field', () => {
    render(<AuthPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
  });

  it('Sign Up form has email, password, and confirm-password fields', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  // ── Google OAuth button ──────────────────────────────────────────────────────

  it('shows Google OAuth button on Login form', () => {
    render(<AuthPage />);
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('shows Google OAuth button on Sign Up form', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  // ── Inline validation errors ─────────────────────────────────────────────────

  it('shows email validation error when Login submitted with empty email', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows password validation error when Login submitted with email but no password', () => {
    render(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows confirm-password validation error when Sign Up submitted with empty confirm field', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
  });

  it('does not call login when Login form has empty fields', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('does not call login when Sign Up form has empty fields', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // ── Auth error alert ─────────────────────────────────────────────────────────

  it('displays auth error alert when login throws', () => {
    mockLogin.mockImplementationOnce(() => { throw new Error('Login failed'); });
    render(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/login failed/i);
  });

  it('displays auth error alert when sign up throws', () => {
    mockLogin.mockImplementationOnce(() => { throw new Error('Sign up failed'); });
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'pass' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/sign up failed/i);
  });

  // ── Successful submission ────────────────────────────────────────────────────

  it('calls login and navigates on valid Login form submit', () => {
    render(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com' }, 'mock-token');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('calls login and navigates on valid Sign Up form submit', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'secret' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(mockLogin).toHaveBeenCalledWith({ email: 'new@example.com' }, 'mock-token');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
