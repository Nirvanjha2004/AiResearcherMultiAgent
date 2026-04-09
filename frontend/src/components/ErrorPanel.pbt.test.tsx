// Feature: multi-agent-research-platform-ui, Property 7: any previous query is restored on Try Again

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { useState } from 'react';
import { ErrorPanel } from './ErrorPanel';
import { QueryInput } from './QueryInput';

describe('ErrorPanel — Property 7: any previous query is restored on Try Again', () => {
  it('restores the previous query into QueryInput after retry', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 120 }), (previousQuery) => {
        function Harness() {
          const [showError, setShowError] = useState(true);

          if (!showError) {
            return <QueryInput onSubmit={vi.fn()} initialQuery={previousQuery} />;
          }

          return (
            <ErrorPanel
              message="An error occurred during the research run."
              previousQuery={previousQuery}
              onRetry={() => setShowError(false)}
            />
          );
        }

        const { unmount } = render(<Harness />);

        fireEvent.click(screen.getByRole('button', { name: /try again/i }));

        const textarea = screen.getByRole('textbox', { name: /research query/i }) as HTMLTextAreaElement;
        expect(textarea.value).toBe(previousQuery);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});