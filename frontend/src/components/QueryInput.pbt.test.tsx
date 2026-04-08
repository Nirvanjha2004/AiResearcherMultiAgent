// Feature: multi-agent-research-platform-ui, Property 2: any whitespace-only string is rejected

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { QueryInput } from './QueryInput';

/**
 * Validates: Requirements 3.7
 *
 * Property 2: For any string that is empty or composed entirely of whitespace
 * characters, submitting it via QueryInput SHALL display an inline validation
 * message and SHALL NOT transition UI_State from `idle` to `loading`
 * (i.e. onSubmit must NOT be called).
 */
describe('QueryInput — Property 2: whitespace-only strings are rejected', () => {
  it('never calls onSubmit for any whitespace-only or empty string', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.trim() === ''),
        (whitespaceQuery) => {
          const onSubmit = vi.fn();
          const { unmount } = render(<QueryInput onSubmit={onSubmit} />);

          const textarea = screen.getByRole('textbox', { name: /research query/i });
          fireEvent.change(textarea, { target: { value: whitespaceQuery } });

          const button = screen.getByRole('button', { name: /start research/i });
          fireEvent.click(button);

          // onSubmit must NOT have been called
          expect(onSubmit).not.toHaveBeenCalled();

          // An inline error message must be visible
          expect(screen.getByRole('alert')).toBeInTheDocument();

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
