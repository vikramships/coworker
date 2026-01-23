import { useState, useRef, useEffect, useCallback } from 'react';

interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error' | 'warning' | 'success';
  timestamp: number;
}

interface TerminalTab {
  id: string;
  name: string;
  cwd: string;
  lines: TerminalLine[];
  currentInput: string;
  commandHistory: string[];
  historyIndex: number;
  filter: 'all' | 'errors' | 'warnings' | 'output';
}

interface TerminalProps {
  cwd?: string;
  className?: string;
  onCommand?: (command: string) => void;
}

type FilterType = 'all' | 'errors' | 'warnings' | 'output';

export function Terminal({ cwd = '~', className = '', onCommand }: TerminalProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>(() => [
    {
      id: '1',
      name: 'Terminal 1',
      cwd,
      lines: [
        {
          id: '1',
          content: `Welcome to Coworker Terminal`,
          type: 'output',
          timestamp: Date.now(),
        },
        {
          id: '2',
          content: `Press Ctrl+R to search history, Ctrl+L to clear`,
          type: 'success',
          timestamp: Date.now(),
        },
      ],
      currentInput: '',
      commandHistory: [],
      historyIndex: -1,
      filter: 'all'
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [historySearch, setHistorySearch] = useState('');
  const [showHistorySearch, setShowHistorySearch] = useState(false);
  const [historyMatches, setHistoryMatches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeTab.lines, activeTab.filter]);

  const updateTab = (tabId: string, updates: Partial<TerminalTab>) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    ));
  };

  const addLine = (tabId: string, content: string, type: 'input' | 'output' | 'error' | 'warning' | 'success' = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: Date.now(),
    };
    updateTab(tabId, {
      lines: [...(tabs.find(t => t.id === tabId)?.lines || []), newLine]
    });
  };

  const getFilteredLines = useCallback((lines: TerminalLine[], filter: FilterType): TerminalLine[] => {
    if (filter === 'all') return lines;
    return lines.filter(line => line.type === filter);
  }, []);

  const executeCommand = async (tabId: string, command: string) => {
    if (!command.trim()) return;

    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    updateTab(tabId, {
      commandHistory: [...tab.commandHistory, command]
    });

    addLine(tabId, `${tab.cwd} $ ${command}`, 'input');

    onCommand?.(command);

    try {
      switch (command.trim()) {
        case 'help':
          addLine(tabId, 'Available commands:', 'output');
          addLine(tabId, '  help     - Show this help', 'output');
          addLine(tabId, '  clear    - Clear terminal', 'output');
          addLine(tabId, '  pwd      - Show current directory', 'output');
          addLine(tabId, '  ls       - List files', 'output');
          addLine(tabId, '  echo     - Echo text', 'output');
          addLine(tabId, '  date     - Show current date', 'output');
          break;

        case 'clear':
          updateTab(tabId, { lines: [] });
          break;

        case 'pwd':
          addLine(tabId, tab.cwd, 'success');
          break;

        case 'ls':
          addLine(tabId, 'src/    package.json    README.md    tsconfig.json', 'output');
          break;

        case 'date':
          addLine(tabId, new Date().toString(), 'success');
          break;

        default:
          if (command.startsWith('echo ')) {
            addLine(tabId, command.substring(5), 'output');
          } else {
            addLine(tabId, `Command not found: ${command}`, 'error');
          }
          break;
      }
    } catch (error) {
      addLine(tabId, `Error executing command: ${error}`, 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = activeTab.currentInput.trim();
    if (command) {
      executeCommand(activeTabId, command);
      updateTab(activeTabId, {
        currentInput: '',
        historyIndex: -1
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showHistorySearch) {
      if (e.key === 'Escape') {
        setShowHistorySearch(false);
        setHistorySearch('');
        updateTab(activeTabId, { historyIndex: -1 });
        inputRef.current?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = historyMatches.indexOf(activeTab.currentInput);
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < historyMatches.length) {
          updateTab(activeTabId, {
            currentInput: historyMatches[newIndex],
            historyIndex: newIndex
          });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeTab.currentInput) {
          executeCommand(activeTabId, activeTab.currentInput);
          setShowHistorySearch(false);
          setHistorySearch('');
          updateTab(activeTabId, {
            currentInput: '',
            historyIndex: -1
          });
        }
      }
      return;
    }

    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      setShowHistorySearch(true);
      return;
    }

    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      updateTab(activeTabId, { lines: [] });
      return;
    }

    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      addLine(activeTabId, '^C', 'warning');
      updateTab(activeTabId, { currentInput: '' });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeTab.historyIndex < activeTab.commandHistory.length - 1) {
        const newIndex = activeTab.historyIndex + 1;
        updateTab(activeTabId, {
          historyIndex: newIndex,
          currentInput: activeTab.commandHistory[activeTab.commandHistory.length - 1 - newIndex]
        });
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeTab.historyIndex > 0) {
        const newIndex = activeTab.historyIndex - 1;
        updateTab(activeTabId, {
          historyIndex: newIndex,
          currentInput: activeTab.commandHistory[activeTab.commandHistory.length - 1 - newIndex]
        });
      } else if (activeTab.historyIndex === 0) {
        updateTab(activeTabId, {
          historyIndex: -1,
          currentInput: ''
        });
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const matches = activeTab.commandHistory.filter(cmd => 
        cmd.startsWith(activeTab.currentInput)
      );
      if (matches.length > 0) {
        updateTab(activeTabId, { currentInput: matches[0] });
      }
    }
  };

  const handleHistorySearchChange = (value: string) => {
    setHistorySearch(value);
    const matches = activeTab.commandHistory.filter(cmd => 
      cmd.toLowerCase().includes(value.toLowerCase())
    );
    setHistoryMatches(matches);
    if (matches.length > 0) {
      updateTab(activeTabId, {
        currentInput: matches[0],
        historyIndex: 0
      });
    }
  };

  const createNewTab = () => {
    const newTabId = Date.now().toString();
    const tabNumber = tabs.length + 1;
    const newTab: TerminalTab = {
      id: newTabId,
      name: `Terminal ${tabNumber}`,
      cwd,
      lines: [
        {
          id: Date.now().toString(),
          content: `Welcome to Coworker Terminal - Tab ${tabNumber}`,
          type: 'output',
          timestamp: Date.now(),
        },
      ],
      currentInput: '',
      commandHistory: [],
      historyIndex: -1,
      filter: 'all'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return;

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      const newActiveTab = newTabs[newTabs.length - 1];
      setActiveTabId(newActiveTab.id);
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-error';
      case 'warning': return 'text-orange-500';
      case 'success': return 'text-success';
      case 'input': return 'text-accent-500';
      default: return 'text-ink-700';
    }
  };

  const filteredLines = getFilteredLines(activeTab.lines, activeTab.filter);

  return (
    <div className={`flex flex-col bg-surface border-t border-ink-900/10 ${className}`}>
      <div className="flex items-center justify-between px-2 py-1 border-b border-ink-900/10 bg-surface-secondary/30">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-colors min-w-0 ${
                activeTabId === tab.id
                  ? 'bg-surface border-accent-500 text-accent-500'
                  : 'bg-surface-secondary/50 border-transparent text-ink-600 hover:text-ink-700 hover:bg-surface-secondary'
              }`}
            >
              <span className="truncate">{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-surface transition-colors opacity-60 hover:opacity-100"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeTab.filter}
            onChange={(e) => updateTab(activeTabId, { filter: e.target.value as FilterType })}
            className="px-2 py-1 text-xs border border-ink-900/10 rounded bg-surface focus:outline-none"
          >
            <option value="all">All</option>
            <option value="errors">Errors</option>
            <option value="warnings">Warnings</option>
            <option value="output">Output</option>
          </select>

          <button
            onClick={createNewTab}
            className="p-1 rounded hover:bg-surface-secondary transition-colors text-ink-600 hover:text-ink-700"
            title="New terminal tab"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm bg-surface"
        style={{ maxHeight: '400px' }}
      >
        {filteredLines.map((line) => (
          <div
            key={line.id}
            className={`mb-1 ${getLineColor(line.type)}`}
          >
            <span className="whitespace-pre-wrap break-words">
              {line.content}
            </span>
          </div>
        ))}

        {showHistorySearch && (
          <div className="my-2 p-2 bg-accent-500/10 border border-accent-500/20 rounded">
            <div className="text-xs text-muted mb-1">
              Search history: {historySearch} ({historyMatches.length} matches)
            </div>
            <div className="text-sm text-accent-500">
              ↑/↓ to navigate, Enter to execute, Esc to cancel
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-success mr-2 flex-shrink-0">{activeTab.cwd} $</span>
          <input
            ref={inputRef}
            type="text"
            value={activeTab.currentInput}
            onChange={(e) => updateTab(activeTabId, { currentInput: e.target.value })}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-ink-700 caret-ink-700"
            autoFocus={!showHistorySearch}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
          {showHistorySearch && (
            <input
              type="text"
              value={historySearch}
              onChange={(e) => handleHistorySearchChange(e.target.value)}
              className="absolute left-0 top-0 opacity-0"
              autoFocus
            />
          )}
        </form>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-ink-900/5 bg-surface-secondary/50">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Ctrl+R</span>
          <span>History</span>
          <span>Ctrl+L</span>
          <span>Clear</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateTab(activeTabId, { lines: [] })}
            className="p-1 rounded hover:bg-surface-secondary transition-colors"
            title="Clear terminal"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <button
            onClick={() => inputRef.current?.focus()}
            className="p-1 rounded hover:bg-surface-secondary transition-colors"
            title="Focus terminal"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}