import { useState, useEffect, useRef } from 'react';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  cwd?: string;
  className?: string;
  onCommand?: (command: string) => void;
}

interface TerminalTab {
  id: string;
  name: string;
  cwd: string;
}

export function Terminal({ cwd = '~', className = '', onCommand }: TerminalProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>(() => [
    { id: '1', name: 'Terminal 1', cwd }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const currentCwdRef = useRef(cwd);

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, monospace',
      theme: {
        background: '#ffffff',
        foreground: '#252422',
        cursor: '#252422',
        cursorAccent: '#ffffff',
        selectionBackground: 'rgba(227, 100, 64, 0.2)',
        black: '#121210',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#06b6d4',
        white: '#7c7a75',
        brightBlack: '#61605c',
        brightRed: '#ef4444',
        brightGreen: '#10b981',
        brightYellow: '#f59e0b',
        brightBlue: '#3b82f6',
        brightMagenta: '#8b5cf6',
        brightCyan: '#06b6d4',
        brightWhite: '#f4f4f5',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // Write welcome message
    term.writeln('\x1b[1;34m🤖 Coworker Terminal\x1b[0m');
    term.writeln('Type commands below. Press Enter to execute.');
    term.writeln('');
    term.write(`${cwd} $ `);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Handle input
    let inputBuffer = '';
    term.onData((data) => {
      const code = data.charCodeAt(0);

      // Handle Enter
      if (code === 13) {
        const command = inputBuffer.trim();
        if (command) {
          term.writeln('');
          executeCommand(command, term, currentCwdRef.current);
          onCommand?.(command);
        } else {
          term.writeln('');
          term.write(`${currentCwdRef.current} $ `);
        }
        inputBuffer = '';
        return;
      }

      // Handle Backspace
      if (code === 127 || code === 8) {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Handle Ctrl+C
      if (code === 3) {
        term.writeln('^C');
        inputBuffer = '';
        term.write(`${currentCwdRef.current} $ `);
        return;
      }

      // Handle printable characters
      if (code >= 32 && code < 127) {
        inputBuffer += data;
        term.write(data);
      }
    });

    // Handle resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // Update cwd when it changes
  useEffect(() => {
    currentCwdRef.current = cwd;
    if (xtermRef.current) {
      xtermRef.current.write(`\r\n${cwd} $ `);
    }
  }, [cwd]);

  // Handle tab switch
  useEffect(() => {
    if (xtermRef.current && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  }, [activeTabId]);

  const executeCommand = async (command: string, term: XTerminal, cwd: string) => {
    try {
      // Use IPC to execute command
      const result = await window.electron.executeCommand({
        command,
        cwd,
        timeout: 30000
      });

      if (result.success) {
        if (result.stdout) {
          term.write(result.stdout);
        }
        if (result.stderr) {
          term.write(`\x1b[31m${result.stderr}\x1b[0m`);
        }
      } else {
        term.write(`\x1b[31mError: ${result.error}\x1b[0m`);
      }

      // Update cwd if changed
      if (result.cwd) {
        currentCwdRef.current = result.cwd;
        setTabs(prev => prev.map(tab =>
          tab.id === activeTabId ? { ...tab, cwd: result.cwd! } : tab
        ));
      }
    } catch (error) {
      term.write(`\x1b[31mFailed to execute command: ${error}\x1b[0m`);
    }

    term.write(`\r\n${currentCwdRef.current} $ `);
  };

  const createNewTab = () => {
    const newTabId = Date.now().toString();
    const tabNumber = tabs.length + 1;
    setTabs(prev => [...prev, {
      id: newTabId,
      name: `Terminal ${tabNumber}`,
      cwd: currentCwdRef.current
    }]);
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

  return (
    <div className={`flex flex-col bg-surface border-t border-ink-900/10 ${className}`}>
      {/* Tab bar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-ink-900/10 bg-surface-secondary/30">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-all duration-200 min-w-0 ${
                activeTabId === tab.id
                  ? 'bg-surface border-accent-500 text-accent-600'
                  : 'bg-surface-secondary/50 border-transparent text-ink-600 hover:text-ink-700 hover:bg-surface-secondary'
              }`}
            >
              <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="18" rx="2" />
                <line x1="6" y1="8" x2="10" y2="8" />
                <line x1="6" y1="12" x2="14" y2="12" />
                <line x1="6" y1="16" x2="10" y2="16" />
              </svg>
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

        <button
          onClick={createNewTab}
          className="p-1.5 rounded hover:bg-surface-secondary transition-colors text-ink-600 hover:text-ink-700"
          title="New terminal tab"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Terminal area */}
      <div
        ref={terminalRef}
        className="flex-1 p-2 overflow-hidden"
        style={{ minHeight: '200px' }}
      />

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-ink-900/5 bg-surface-secondary/50 text-xs text-muted">
        <span>{activeTab.cwd}</span>
        <div className="flex items-center gap-3">
          <span>Ctrl+C interrupt</span>
          <span>Ctrl+L clear</span>
        </div>
      </div>
    </div>
  );
}
