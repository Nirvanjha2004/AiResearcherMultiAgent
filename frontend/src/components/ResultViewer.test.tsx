import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultViewer } from './ResultViewer';

const SAMPLE_MARKDOWN = `# Hello World

This is a paragraph.

- Item one
- Item two

\`\`\`js
const x = 1;
\`\`\`

Inline \`code\` here.
`;

describe('ResultViewer', () => {
  it('renders markdown content', () => {
    render(<ResultViewer markdown={SAMPLE_MARKDOWN} onNewResearch={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeInTheDocument();
    expect(screen.getByText('This is a paragraph.')).toBeInTheDocument();
  });

  it('renders the floating action bar', () => {
    render(<ResultViewer markdown={SAMPLE_MARKDOWN} onNewResearch={vi.fn()} />);
    expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    expect(screen.getByTestId('download-button')).toBeInTheDocument();
    expect(screen.getByTestId('new-research-button')).toBeInTheDocument();
  });
});

describe('FloatingActionBar — Copy to Clipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('calls clipboard.writeText with the markdown on copy click', async () => {
    const user = userEvent.setup();
    render(<ResultViewer markdown="# Test" onNewResearch={vi.fn()} />);

    await user.click(screen.getByTestId('copy-button'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Test');
  });

  it('shows confirmation indicator after copy', async () => {
    const user = userEvent.setup();
    render(<ResultViewer markdown="# Test" onNewResearch={vi.fn()} />);

    await user.click(screen.getByTestId('copy-button'));

    await waitFor(() => {
      expect(screen.getByTestId('copy-confirmation')).toBeInTheDocument();
    });
  });

  it('hides confirmation indicator after 2000ms', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ResultViewer markdown="# Test" onNewResearch={vi.fn()} />);

    await user.click(screen.getByTestId('copy-button'));

    await waitFor(() => {
      expect(screen.getByTestId('copy-confirmation')).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(2001);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('copy-confirmation')).not.toBeInTheDocument();
    });
  });
});

describe('FloatingActionBar — Download as Markdown', () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let clickMock: ReturnType<typeof vi.fn>;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLMock = vi.fn();
    clickMock = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    // Intercept anchor creation to capture click
    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(clickMock);
      }
      return el;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('triggers a download with .md filename on download click', async () => {
    const user = userEvent.setup();
    render(<ResultViewer markdown="# Download Test" onNewResearch={vi.fn()} />);

    await user.click(screen.getByTestId('download-button'));

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
  });
});

describe('FloatingActionBar — New Research', () => {
  it('calls onNewResearch when New Research button is clicked', async () => {
    const onNewResearch = vi.fn();
    const user = userEvent.setup();
    render(<ResultViewer markdown="# Test" onNewResearch={onNewResearch} />);

    await user.click(screen.getByTestId('new-research-button'));

    expect(onNewResearch).toHaveBeenCalledTimes(1);
  });
});
