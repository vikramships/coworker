import { useState, useEffect, useRef, useCallback } from 'react';

interface Command {
  id: string;
  label: string;
  shortcut: string;
  description: string;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = [
    { id: 'new-file', label: 'New File', shortcut: 'Ctrl+N', description: 'Create a new file', category: 'File', action: () => console.log('New file') },
    { id: 'open-file', label: 'Open File', shortcut: 'Ctrl+O', description: 'Open an existing file', category: 'File', action: () => console.log('Open file') },
    { id: 'save-file', label: 'Save File', shortcut: 'Ctrl+S', description: 'Save the current file', category: 'File', action: () => console.log('Save file') },
    { id: 'find-in-files', label: 'Find in Files', shortcut: 'Ctrl+Shift+F', description: 'Search for text across files', category: 'Search', action: () => console.log('Find in files') },
    { id: 'find-in-editor', label: 'Find in Editor', shortcut: 'Ctrl+F', description: 'Find text in current file', category: 'Search', action: () => console.log('Find in editor') },
    { id: 'replace-in-editor', label: 'Replace in Editor', shortcut: 'Ctrl+H', description: 'Find and replace text in current file', category: 'Search', action: () => console.log('Replace in editor') },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: 'Ctrl+B', description: 'Show/hide file explorer sidebar', category: 'View', action: () => console.log('Toggle sidebar') },
    { id: 'toggle-files', label: 'Toggle Files', shortcut: 'Ctrl+Shift+E', description: 'Show/hide file explorer', category: 'View', action: () => console.log('Toggle files') },
    { id: 'run-test', label: 'Run Tests', shortcut: 'Ctrl+T', description: 'Run tests for current project', category: 'Debug', action: () => console.log('Run tests') },
    { id: 'debug', label: 'Start Debug', shortcut: 'F5', description: 'Start debugging', category: 'Debug', action: () => console.log('Start debug') },
    { id: 'format-code', label: 'Format Code', shortcut: 'Shift+Alt+F', description: 'Format the current file', category: 'Editor', action: () => console.log('Format code') },
    { id: 'go-to-line', label: 'Go to Line', shortcut: 'Ctrl+G', description: 'Jump to a specific line number', category: 'Editor', action: () => console.log('Go to line') },
    { id: 'go-to-definition', label: 'Go to Definition', shortcut: 'F12', description: 'Go to symbol definition', category: 'Editor', action: () => console.log('Go to definition') },
    { id: 'open-settings', label: 'Open Settings', shortcut: 'Ctrl+,', description: 'Open application settings', category: 'General', action: () => console.log('Open settings') },
    { id: 'switch-ide-mode', label: 'Switch IDE Mode', shortcut: 'Ctrl+Shift+M', description: 'Toggle between chat and IDE mode', category: 'View', action: () => console.log('Switch IDE mode') },
  ];

  const filteredCommands = useCallback(() => {
    if (!query.trim()) return commands;
    
    const q = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  }, [query, commands]);

  const filtered = filteredCommands();
  const categories = Array.from(new Set(filtered.map(c => c.category)));

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current && selectedIndex >= 0) {
      const items = scrollRef.current.querySelectorAll('[data-command-index]');
      const selectedItem = items[selectedIndex] as HTMLElement;
      selectedItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="w-full max-w-2xl mx-4 bg-surface border border-ink-900/10 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-ink-900/5">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="w-full pl-10 pr-4 py-3 text-sm bg-surface-secondary border border-ink-900/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
              autoFocus
            />
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface border border-ink-900/10 rounded text-xs">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface border border-ink-900/10 rounded text-xs">↵</kbd>
              Execute
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface border border-ink-900/10 rounded text-xs">Esc</kbd>
              Close
            </span>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="max-h-96 overflow-y-auto p-2"
        >
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted">
              <svg className="h-12 w-12 mx-auto mb-4 text-muted-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm">No commands found</p>
            </div>
          ) : (
            categories.map(category => {
              const categoryCommands = filtered.filter(c => c.category === category);
              return (
                <div key={category} className="mb-3">
                  <div className="px-2 py-1 text-xs font-medium text-muted uppercase tracking-wide">
                    {category}
                  </div>
                  {categoryCommands.map((command) => {
                    const globalIndex = filtered.indexOf(command);
                    return (
                      <button
                        key={command.id}
                        data-command-index={globalIndex}
                        onClick={() => {
                          command.action();
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${
                          selectedIndex === globalIndex
                            ? 'bg-accent-500/10 border border-accent-500/20'
                            : 'hover:bg-surface-secondary'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-ink-900">
                            {command.label}
                          </div>
                          <div className="text-xs text-muted">
                            {command.description}
                          </div>
                        </div>
                        <kbd className="px-1.5 py-0.5 bg-surface-secondary border border-ink-900/10 rounded text-xs font-mono">
                          {command.shortcut}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
    </div>
  );
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const registerCommand = useCallback((_id: string, _action: () => void) => {
  }, []);

  const unregisterCommand = useCallback((_id: string) => {
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open,
    close,
    registerCommand,
    unregisterCommand
  };
}