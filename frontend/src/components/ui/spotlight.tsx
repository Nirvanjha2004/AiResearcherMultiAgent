import type { JSX } from 'react';
import { cn } from '../../lib/utils';

interface SpotlightProps {
  className?: string;
}

export function Spotlight({ className }: SpotlightProps): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -top-56 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.23),rgba(56,189,248,0.16),transparent_65%)] blur-3xl',
        className,
      )}
    />
  );
}
