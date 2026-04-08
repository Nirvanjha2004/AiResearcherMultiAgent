// Feature: multi-agent-research-platform-ui, Property 5: any sequence of log lines appears in order

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { LogPanel } from './LogPanel';

/**
 * Validates: Requirements 4.3
 *
 * Property 5: For any sequence of log line strings emitted by the streaming
 * source, the Log_Panel SHALL contain all lines in the same order they were
 * emitted, with each line visible in the DOM.
 */
describe('LogPanel — Property 5: any sequence of log lines appears in order', () => {
  it('renders all lines in the correct order for any input sequence', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1 }),
        (lines) => {
          const { unmount } = render(<LogPanel lines={lines} isLoading={false} />);

          // Collect all rendered text nodes that match our lines
          // Each line should appear in the DOM
          lines.forEach((line) => {
            // Lines may be empty strings — skip DOM check for empty strings
            // since they render as empty elements
            if (line.length > 0) {
              const elements = screen.getAllByText(line);
              expect(elements.length).toBeGreaterThan(0);
            }
          });

          // Verify ordering: get all log line elements and check their text content
          // matches the original lines array order
          const container = document.querySelector('.font-mono');
          if (container) {
            // Get all direct motion.div children (log lines)
            const lineElements = Array.from(
              container.querySelectorAll(':scope > div')
            );

            // Filter to only the line elements (not the cursor span)
            const textElements = lineElements.filter(
              (el) => el.tagName === 'DIV'
            );

            // Each rendered div should match the corresponding line
            textElements.forEach((el, idx) => {
              if (idx < lines.length) {
                expect(el.textContent).toBe(lines[idx]);
              }
            });
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
