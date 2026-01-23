

interface EditorTab {
  id: string;
  title: string;
  filePath: string;
  isDirty: boolean;
  isActive: boolean;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabSave?: (tabId: string) => void;
  className?: string;
}

export function EditorTabs({
  tabs,
  onTabClick,
  onTabClose,
  onTabSave,
  className = ''
}: EditorTabsProps) {
  if (tabs.length === 0) {
    return (
      <div className={`h-10 border-b border-ink-900/10 bg-surface-secondary/50 ${className}`}>
        <div className="flex items-center justify-center h-full text-sm text-muted">
          No files open
        </div>
      </div>
    );
  }

  return (
    <div className={`flex overflow-x-auto border-b border-ink-900/10 bg-surface-secondary/50 ${className}`}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center min-w-0 max-w-xs border-r border-ink-900/5 cursor-pointer group ${
            tab.isActive
              ? 'bg-surface border-b-2 border-b-accent-500'
              : 'bg-surface-secondary/30 hover:bg-surface-secondary/50'
          }`}
          onClick={() => onTabClick(tab.id)}
        >
          {/* Tab content */}
          <div className="flex items-center px-3 py-2 min-w-0 flex-1">
            {/* File icon */}
            <span className="mr-2 text-sm flex-shrink-0">
              {getFileIcon(tab.filePath)}
            </span>

            {/* File name */}
            <span className="text-sm truncate flex-1">
              {tab.title}
            </span>

            {/* Dirty indicator */}
            {tab.isDirty && (
              <span className="ml-1 w-2 h-2 bg-accent-500 rounded-full flex-shrink-0" />
            )}
          </div>

          {/* Close button */}
          <button
            className={`p-1 mr-1 rounded hover:bg-surface-secondary transition-colors ${
              tab.isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (tab.isDirty) {
                // TODO: Show save confirmation dialog
                const shouldSave = confirm(`Save changes to ${tab.title}?`);
                if (shouldSave) {
                  onTabSave?.(tab.id);
                }
              }
              onTabClose(tab.id);
            }}
            aria-label="Close tab"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {/* Add tab button */}
      <div className="flex items-center px-2">
        <button
          className="p-1 rounded hover:bg-surface-secondary transition-colors"
          onClick={() => {
            // TODO: Open file picker
          }}
          aria-label="Add new tab"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function getFileIcon(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  const ext = fileName.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    ts: '🟦',
    tsx: '🔵',
    js: '🟨',
    jsx: '🟨',
    py: '🐍',
    rs: '🦀',
    go: '🐹',
    java: '☕',
    cpp: '🔧',
    c: '🔧',
    h: '📋',
    hpp: '📋',
    css: '🎨',
    scss: '🎨',
    html: '🌐',
    xml: '📄',
    json: '📋',
    yaml: '📄',
    yml: '📄',
    md: '📝',
    txt: '📄',
    sh: '⚡',
    bash: '⚡',
    zsh: '⚡',
    sql: '🗄️',
    gitignore: '🚫',
    env: '🔒',
  };

  return iconMap[ext || ''] || '📄';
}