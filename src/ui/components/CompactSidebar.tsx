import { useAppStore } from "../store/useAppStore";

interface CompactSidebarProps {
  connected: boolean;
  onNewSession: () => void;
  onOpenSettings: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onExpand: () => void;
}

export function CompactSidebar({
  connected,
  onNewSession,
  onOpenSettings,
  onExpand
}: CompactSidebarProps) {
  const sessions = useAppStore((state) => state.sessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[72px] flex flex-col items-center py-4 border-r border-ink-900/10 bg-surface/80 backdrop-blur-xl z-50">
      {/* Logo */}
      <div
        className="w-12 h-12 rounded-xl bg-[#0F0F1A] flex items-center justify-center mb-4 cursor-pointer hover:scale-105 transition-transform"
        onClick={onExpand}
      >
        <svg className="h-6 w-6" viewBox="0 0 512 512" fill="none">
          <path d="M360 160C330 130 290 120 245 120C165 120 105 180 105 256C105 332 165 392 245 392C290 392 330 382 360 352"
            stroke="#F5A623" strokeWidth="56" strokeLinecap="round" />
          <rect x="250" y="232" width="130" height="48" rx="24" fill="#F5A623" />
        </svg>
      </div>

      {/* New Session Button */}
      <button
        className="w-12 h-12 rounded-xl bg-accent-500 hover:bg-accent-600 flex items-center justify-center text-white shadow-sm transition-all hover:shadow-md active:scale-[0.95] mb-3"
        onClick={onNewSession}
        title="New Session"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Session List (Recent) */}
      <div className="flex-1 overflow-y-auto w-full px-2">
        {Object.values(sessions).slice(0, 5).map((session) => (
          <button
            key={session.id}
            className={`w-full aspect-square rounded-xl mb-2 flex items-center justify-center transition-all ${
              activeSessionId === session.id
                ? "bg-accent-100 dark:bg-accent-500/20 text-accent-600"
                : "text-muted hover:bg-surface-secondary hover:text-ink-600"
            }`}
            onClick={() => useAppStore.getState().setActiveSessionId(session.id)}
            title={session.title || "Untitled"}
          >
            <span className="text-xs font-medium truncate px-1">
              {session.title?.charAt(0) || "?"}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-2 mt-auto pt-4 border-t border-ink-900/10 w-full px-2">
        {/* Expand Button */}
        <button
          className="w-12 h-10 rounded-lg flex items-center justify-center text-muted hover:text-ink-600 hover:bg-surface-secondary transition-colors"
          onClick={onExpand}
          title="Expand sidebar"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Settings */}
        <button
          className="w-12 h-10 rounded-lg flex items-center justify-center text-muted hover:text-ink-600 hover:bg-surface-secondary transition-colors"
          onClick={onOpenSettings}
          title="Settings"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
          </svg>
        </button>

        {/* Connection Status */}
        <div className={`w-2 h-2 rounded-full mb-2 ${connected ? 'bg-success animate-pulse' : 'bg-muted'}`} title={connected ? "Connected" : "Disconnected"} />
      </div>
    </aside>
  );
}
