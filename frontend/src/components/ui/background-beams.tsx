import type { JSX } from 'react';

export function BackgroundBeams(): JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-16 top-20 h-72 w-[28rem] rotate-12 bg-gradient-to-r from-cyan-500/20 to-transparent blur-2xl animate-pulse" />
      <div className="absolute right-[-6rem] top-40 h-80 w-[30rem] -rotate-12 bg-gradient-to-l from-indigo-500/20 to-transparent blur-2xl animate-pulse [animation-delay:250ms]" />
      <div className="absolute left-1/3 bottom-[-5rem] h-64 w-[24rem] -rotate-6 bg-gradient-to-t from-sky-500/15 to-transparent blur-2xl animate-pulse [animation-delay:400ms]" />
    </div>
  );
}
