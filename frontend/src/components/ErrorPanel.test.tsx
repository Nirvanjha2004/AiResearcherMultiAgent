import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorPanel } from './ErrorPanel';

describe('ErrorPanel', () => {
  it('shows the error message, previous query, and retry button', () => {
    render(
      <ErrorPanel
        message="An error occurred during the research run."
        previousQuery="What is quantum computing?"
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/an error occurred/i);
    expect(screen.getByText(/previous query/i)).toBeInTheDocument();
    expect(screen.getByText('What is quantum computing?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry when Try Again is clicked', () => {
    const onRetry = vi.fn();

    render(
      <ErrorPanel
        message="An error occurred during the research run."
        previousQuery="What is quantum computing?"
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});