import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { useAppStore } from "../store/useAppStore";

interface SidebarProps {
  connected: boolean;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenSettings: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onCollapse?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  running: "bg-info",
  completed: "bg-success",
  error: "bg-error",
  pending: "bg-muted",
};

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  completed: "Completed",
  error: "Error",
  pending: "Pending",
};

export function Sidebar({
  onNewSession,
  onDeleteSession,
  onOpenSettings,
  isOpen = false,
  onClose,
  onCollapse
}: SidebarProps) {
  const sessions = useAppStore((state) => state.sessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const setActiveSessionId = useAppStore((state) => state.setActiveSessionId);
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const formatCwd = (cwd?: string) => {
    if (!cwd) return "Working dir unavailable";
    const parts = cwd.split(/[\\/]+/).filter(Boolean);
    const tail = parts.slice(-2).join("/");
    return `/${tail || cwd}`;
  };

  const formatTime = useCallback((timestamp?: number) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  const sessionList = useMemo(() => {
    const list = Object.values(sessions);
    list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return list;
  }, [sessions]);

  useEffect(() => {
    setCopied(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, [resumeSessionId]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const handleCopyCommand = async () => {
    if (!resumeSessionId) return;
    const command = `claude --resume ${resumeSessionId}`;
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    setCopied(true);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setResumeSessionId(null);
    }, 3000);
  };

  const handleSessionClick = (sessionId: string) => {
    setActiveSessionId(sessionId);
    if (onClose) onClose(); // Close mobile sidebar when session is selected
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className="lg:fixed fixed lg:top-0 top-12 inset-y-0 left-0 flex h-screen lg:h-full w-[260px] flex-col border-r border-ink-900/10 glass-morphism z-50">
        {/* Drag handle area */}
        <div
          className="absolute top-0 left-0 right-0 h-12 lg:hidden"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />

        <div className="flex flex-col gap-3 px-3 pb-4 pt-12 lg:pt-14">
          {/* Header with collapse button */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F0F1A] flex items-center justify-center border border-white/5">
                <svg className="h-5 w-5" viewBox="0 0 512 512" fill="none">
                  <path d="M360 160C330 130 290 120 245 120C165 120 105 180 105 256C105 332 165 392 245 392C290 392 330 382 360 352" stroke="#F5A623" strokeWidth="60" strokeLinecap="round" />
                  <rect x="250" y="232" width="130" height="48" rx="24" fill="#F5A623" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-ink-800">Coworker</span>
            </div>
            <button
              className="p-1.5 rounded-lg text-muted hover:text-ink-600 hover:bg-surface-secondary transition-colors"
              onClick={onCollapse}
              title="Collapse sidebar"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>

          {/* New Session Button */}
          <button
            className="w-full rounded-xl bg-accent-500 hover:bg-accent-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-glow active:scale-[0.98] group"
            onClick={onNewSession}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Session
            </span>
          </button>

          {/* Settings Button */}
          <button
            className="w-full rounded-xl border border-ink-900/10 bg-surface hover:bg-surface-secondary px-4 py-2.5 text-sm font-medium text-ink-700 transition-all hover:border-ink-900/20 flex items-center justify-center gap-2"
            onClick={onOpenSettings}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
            </svg>
            Settings
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Sessions</span>
            <span className="text-xs text-muted">{sessionList.length}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {sessionList.length === 0 && (
              <div className="rounded-xl border border-ink-900/5 bg-surface-secondary/50 px-4 py-6 text-center">
                <svg className="h-8 w-8 mx-auto text-muted-light mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-muted">No sessions yet</p>
                <p className="text-xs text-muted-light mt-1">Start a conversation to begin</p>
              </div>
            )}

            {sessionList.map((session) => (
              <div
                key={session.id}
                className={`group relative cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-all duration-200 interactive-card ${activeSessionId === session.id
                  ? "border-accent-500/30 bg-accent-50/50 dark:bg-accent-500/10 shadow-sm"
                  : "border-transparent bg-transparent hover:bg-surface-secondary/50"
                  }`}
                onClick={() => handleSessionClick(session.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSessionId(session.id); } }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                    {/* Title with status indicator */}
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[session.status] || STATUS_COLORS.pending} ${session.status === 'running' ? 'animate-pulse' : ''}`} />
                      <span className={`text-sm font-medium truncate ${activeSessionId === session.id ? "text-ink-900" : "text-ink-700"
                        }`}>
                        {session.title || "Untitled"}
                      </span>
                    </div>

                    {/* Working directory and time */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted truncate flex-1">{formatCwd(session.cwd)}</span>
                      <span className="text-[10px] text-muted-light flex-shrink-0 font-medium">{formatTime(session.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Active Indicator Pill */}
                  {activeSessionId === session.id && (
                    <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-accent-500 shadow-[0_0_8px_rgba(227,100,64,0.5)]" />
                  )}

                  {/* Session menu */}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="flex-shrink-0 rounded-lg p-1.5 text-ink-400 hover:text-ink-600 hover:bg-surface-secondary opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Open session menu"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="1.7" />
                          <circle cx="12" cy="12" r="1.7" />
                          <circle cx="19" cy="12" r="1.7" />
                        </svg>
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="z-50 min-w-[200px] rounded-xl border border-ink-900/10 bg-surface p-1 shadow-lg animate-scale-in"
                        align="end"
                        sideOffset={8}
                      >
                        <DropdownMenu.Item
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 outline-none hover:bg-surface-secondary transition-colors"
                          onSelect={() => onDeleteSession(session.id)}
                        >
                          <svg className="h-4 w-4 text-error/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 7h16" />
                            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            <path d="M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l1-12" />
                          </svg>
                          Delete session
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 outline-none hover:bg-surface-secondary transition-colors"
                          onSelect={() => setResumeSessionId(session.id)}
                        >
                          <svg className="h-4 w-4 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 5h16v14H4z" />
                            <path d="M7 9h10M7 12h6" />
                            <path d="M13 15l3 2-3 2" />
                          </svg>
                          Resume in Claude
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>

                {/* Status label */}
                <div className="absolute bottom-1 right-2">
                  <span className="text-[10px] text-ink-600 dark:text-ink-400 group-hover:text-ink-800 dark:group-hover:text-ink-200 transition-colors duration-200">
                    {STATUS_LABELS[session.status] || STATUS_LABELS.pending}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-ink-900/5 px-3 py-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted">Ready</span>
            </div>
            <span className="text-xs text-muted-light">v0.0.4</span>
          </div>
        </div>

        {/* Resume Dialog */}
        <Dialog.Root open={!!resumeSessionId} onOpenChange={(open) => !open && setResumeSessionId(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-xl animate-scale-in">
              <div className="flex items-start justify-between gap-4">
                <Dialog.Title className="text-lg font-semibold text-ink-800">Resume Session</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded-full p-1.5 text-ink-500 hover:bg-surface-secondary transition-colors" aria-label="Close dialog">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6l-12 12" />
                    </svg>
                  </button>
                </Dialog.Close>
              </div>
              <p className="mt-2 text-sm text-muted">Copy this command to resume the session in Claude Code:</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2.5">
                <code className="flex-1 font-mono text-xs text-ink-700 break-all">
                  {resumeSessionId ? `claude --resume ${resumeSessionId}` : ""}
                </code>
                <button
                  className={`rounded-lg p-2 transition-all ${copied ? "text-success" : "text-ink-500 hover:bg-surface"
                    }`}
                  onClick={handleCopyCommand}
                  aria-label="Copy resume command"
                >
                  {copied ? (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </aside>
    </>
  );
}
