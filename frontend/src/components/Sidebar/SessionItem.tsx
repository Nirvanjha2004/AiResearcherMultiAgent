import { SessionItemProps } from '../../types';

export function SessionItem({ session, isActive, onClick }: SessionItemProps) {
  return (
    <button
      data-testid={`session-item-${session.id}`}
      onClick={() => onClick(session)}
      style={{ transition: 'background-color 200ms ease-in-out, transform 150ms ease-out' }}
      className={[
        'w-full text-left px-3 py-2 rounded-xl text-sm truncate',
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02]',
      ].join(' ')}
    >
      {session.query}
    </button>
  );
}
