import { motion } from 'framer-motion';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Command, Plus } from 'lucide-react';
import { Session } from '../../types';
import { HoverBorderGradient } from '../ui/hover-border-gradient';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectSession: (session: Session) => void;
  onNewChat: () => void;
  onOpenPalette: () => void;
  userEmail: string;
  userDisplayName: string;
  onLogout: () => void;
  testId?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function Sidebar({
  sessions,
  activeSessionId,
  searchValue,
  onSearchChange,
  onSelectSession,
  onNewChat,
  onOpenPalette,
  userEmail,
  userDisplayName,
  onLogout,
  testId = 'sidebar',
}: SidebarProps) {
  const { updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(userDisplayName);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(userDisplayName);
  }, [userDisplayName]);

  const filteredSessions = sessions.filter((session) =>
    session.query.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextDisplayName = displayName.trim();
    if (!nextDisplayName) {
      setProfileError('Display name is required.');
      setProfileMessage(null);
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      await updateProfile(nextDisplayName);
      setProfileMessage('Profile updated.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const initialsSource = userDisplayName || userEmail;
  const initials = initialsSource.slice(0, 1).toUpperCase();

  return (
    <aside
      data-testid={testId}
      className="relative flex h-full w-full flex-col border-r border-zinc-800/90 bg-zinc-950/70 p-4 backdrop-blur-xl"
    >
      <div className="mb-4 space-y-3">
        <HoverBorderGradient onClick={onNewChat} data-testid="new-research-button">
          <Plus size={15} />
          <span>New Chat</span>
        </HoverBorderGradient>

        <button
          type="button"
          onClick={onOpenPalette}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
        >
          <span className="flex items-center gap-2">
            <Command size={14} />
            Quick Switch
          </span>
          <span className="rounded-md border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">Ctrl+K</span>
        </button>

        <input
          value={searchValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="Search chats"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/60 focus:outline-none"
        />
      </div>

      <div className="saas-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
        {filteredSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-500">
            No conversations yet.
          </div>
        ) : (
          filteredSessions.map((session) => (
            <motion.button
              key={session.id}
              data-testid={`session-item-${session.id}`}
              whileHover={{ y: -1, scale: 1.01 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={() => onSelectSession(session)}
              className={cn(
                'w-full rounded-2xl border p-3 text-left transition duration-150',
                activeSessionId === session.id
                  ? 'border-cyan-500/50 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 shadow-[0_8px_25px_rgba(56,189,248,0.14)]'
                  : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-900',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-sm font-medium text-zinc-100">{session.query}</p>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-500">{formatDate(session.createdAt)}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{session.result.slice(0, 90) || 'No preview available'}</p>
            </motion.button>
          ))
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">
              {userDisplayName}
            </p>
            <p className="truncate text-sm text-zinc-100">{userEmail}</p>
            <p className="text-[11px] text-zinc-500">Pro Workspace</p>
          </div>
        </div>

        <form className="mt-3 space-y-2" onSubmit={handleProfileSubmit}>
          <label className="block text-[11px] uppercase tracking-wide text-zinc-500" htmlFor="display-name-input">
            Display name
          </label>
          <input
            id="display-name-input"
            value={displayName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value)}
            placeholder="Update your profile name"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/60 focus:outline-none"
          />
          {profileError && <p className="text-xs text-red-400">{profileError}</p>}
          {profileMessage && <p className="text-xs text-emerald-400">{profileMessage}</p>}
          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProfile ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 w-full rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent" />
    </aside>
  );
}
