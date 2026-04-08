// Feature: multi-agent-research-platform-ui, Property 6: any markdown string renders correct HTML elements

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ResultViewer } from './ResultViewer';

/**
 * Validates: Requirements 5.3
 *
 * Property 6: For any markdown string containing headings, paragraphs, lists,
 * code blocks, or inline code, the Result_Viewer SHALL render the corresponding
 * HTML elements (h1–h6, p, ul/ol/li, pre/code).
 */

// Arbitraries for each markdown construct
const headingArb = fc.tuple(fc.integer({ min: 1, max: 6 }), fc.string({ minLength: 1 })).map(
  ([level, text]) => ({ md: `${'#'.repeat(level)} ${text}`, tag: `h${level}`, text }
));

const paragraphArb = fc
  .string({ minLength: 1 })
  .filter((s) => !s.startsWith('#') && !s.startsWith('-') && !s.startsWith('`') && !s.includes('\n'))
  .map((text) => ({ md: text, tag: 'p', text }));

const unorderedListArb = fc
  .array(fc.string({ minLength: 1 }).filter((s) => !s.includes('\n')), { minLength: 1, maxLength: 5 })
  .map((items) => ({
    md: items.map((i) => `- ${i}`).join('\n'),
    tag: 'ul',
    items,
  }));

const orderedListArb = fc
  .array(fc.string({ minLength: 1 }).filter((s) => !s.includes('\n')), { minLength: 1, maxLength: 5 })
  .map((items) => ({
    md: items.map((i, idx) => `${idx + 1}. ${i}`).join('\n'),
    tag: 'ol',
    items,
  }));

const codeBlockArb = fc
  .string({ minLength: 1 })
  .filter((s) => !s.includes('```'))
  .map((code) => ({ md: `\`\`\`\n${code}\n\`\`\``, tag: 'pre' }));

describe('ResultViewer — Property 6: any markdown string renders correct HTML elements', () => {
  it('renders h1–h6 for heading markdown', () => {
    fc.assert(
      fc.property(headingArb, ({ md, tag }) => {
        const { container, unmount } = render(
          <ResultViewer markdown={md} onNewResearch={() => {}} />
        );
        const el = container.querySelector(tag);
        expect(el).not.toBeNull();
        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('renders <p> for paragraph markdown', () => {
    fc.assert(
      fc.property(paragraphArb, ({ md }) => {
        const { container, unmount } = render(
          <ResultViewer markdown={md} onNewResearch={() => {}} />
        );
        const el = container.querySelector('p');
        expect(el).not.toBeNull();
        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('renders <ul> and <li> for unordered list markdown', () => {
    fc.assert(
      fc.property(unorderedListArb, ({ md, items }) => {
        const { container, unmount } = render(
          <ResultViewer markdown={md} onNewResearch={() => {}} />
        );
        const ul = container.querySelector('ul');
        expect(ul).not.toBeNull();
        const lis = container.querySelectorAll('li');
        expect(lis.length).toBe(items.length);
        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('renders <ol> and <li> for ordered list markdown', () => {
    fc.assert(
      fc.property(orderedListArb, ({ md, items }) => {
        const { container, unmount } = render(
          <ResultViewer markdown={md} onNewResearch={() => {}} />
        );
        const ol = container.querySelector('ol');
        expect(ol).not.toBeNull();
        const lis = container.querySelectorAll('li');
        expect(lis.length).toBe(items.length);
        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('renders <pre> and <code> for fenced code block markdown', () => {
    fc.assert(
      fc.property(codeBlockArb, ({ md }) => {
        const { container, unmount } = render(
          <ResultViewer markdown={md} onNewResearch={() => {}} />
        );
        const pre = container.querySelector('pre');
        expect(pre).not.toBeNull();
        const code = container.querySelector('pre code');
        expect(code).not.toBeNull();
        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
