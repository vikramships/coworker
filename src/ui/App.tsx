import { useCallback, useEffect, useRef, useState } from "react";
import type { PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import { useIPC } from "./hooks/useIPC";
import { useTheme } from "./hooks/useTheme";
import { useAppStore, useShallow } from "./store/useAppStore";
import type { ServerEvent } from "./types";
import { Sidebar } from "./components/Sidebar";
import { CompactSidebar } from "./components/CompactSidebar";
import { ResizablePanel } from "./components/ResizablePanel";
import { StartSessionModal } from "./components/StartSessionModal";
import { SettingsModal } from "./components/SettingsModal";
import { PromptInput, usePromptActions } from "./components/PromptInput";
import { MessageCard } from "./components/EventCard";
import { ToastContainer } from "./components/Toast";
import { FileTree } from "./components/FileTree";
import { Terminal } from "./components/Terminal";
import MDContent from "./render/markdown";

function App() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const partialMessageRef = useRef("");
  // Initialize theme on app load
  useTheme();
  const [partialMessage, setPartialMessage] = useState("");
  const [showPartialMessage, setShowPartialMessage] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Default to collapsed
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'files' | 'terminal'>('files');
  const [defaultCwd, setDefaultCwd] = useState<string>('~');

  // Get home directory on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getHomeDir().then(setDefaultCwd).catch(() => {
        // Fallback to common paths
        const possiblePaths = ['/Users', '/home'];
        setDefaultCwd(possiblePaths.find(p => p) || '~');
      });
    }
  }, []);

  // Consolidated state selectors to prevent multiple re-renders
  const appState = useAppStore(useShallow((s) => ({
    sessions: s.sessions,
    activeSessionId: s.activeSessionId,
    showStartModal: s.showStartModal,
    showSettingsModal: s.showSettingsModal,
    globalError: s.globalError,
    historyRequested: s.historyRequested,
    prompt: s.prompt,
    cwd: s.cwd,
    pendingStart: s.pendingStart,
    setShowStartModal: s.setShowStartModal,
    setShowSettingsModal: s.setShowSettingsModal,
    setGlobalError: s.setGlobalError,
    markHistoryRequested: s.markHistoryRequested,
    resolvePermissionRequest: s.resolvePermissionRequest,
    handleServerEvent: s.handleServerEvent,
    setPrompt: s.setPrompt,
    setCwd: s.setCwd
  })));

  const {
    sessions,
    activeSessionId,
    showStartModal,
    showSettingsModal,
    globalError,
    historyRequested,
    prompt,
    cwd,
    pendingStart,
    setShowStartModal,
    setShowSettingsModal,
    setGlobalError,
    markHistoryRequested,
    resolvePermissionRequest,
    handleServerEvent,
    setPrompt,
    setCwd
  } = appState;

  // Helper function to safely convert any value to a string representation
  const safeStringify = (value: unknown): string => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch (error) {
        return String(value);
      }
    }
    return String(value);
  };

  // Helper function to extract partial message content
  const getPartialMessageContent = (eventMessage: any) => {
    try {
      const delta = eventMessage.delta;
      if (!delta) return "";

      // Handle different delta types: text_delta, thinking_delta, etc.
      // The content is in a property named after the type without "_delta" suffix
      const deltaType = delta.type; // e.g., "text_delta", "thinking_delta"
      const contentKey = deltaType?.replace("_delta", ""); // e.g., "text", "thinking"
      const content = delta[contentKey];

      // Ensure content is always a string
      if (typeof content === 'string') return content;
      if (typeof content === 'object' && content !== null) {
        // If content is an object, try to extract text property, otherwise stringify the object
        return content.text || safeStringify(content);
      }
      return safeStringify(content);
    } catch (error) {
      console.error("Error extracting partial message content:", error);
      return "";
    }
  };

  // Handle partial messages from stream events
  const handlePartialMessages = useCallback((partialEvent: ServerEvent) => {
    if (partialEvent.type !== "stream.message" || partialEvent.payload.message.type !== "stream_event") return;

    const message = partialEvent.payload.message as any;
    if (message.event.type === "content_block_start") {
      partialMessageRef.current = "";
      setPartialMessage(partialMessageRef.current);
      setShowPartialMessage(true);
    }

    if (message.event.type === "content_block_delta") {
      partialMessageRef.current += getPartialMessageContent(message.event) || "";
      setPartialMessage(partialMessageRef.current);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    if (message.event.type === "content_block_stop") {
      setShowPartialMessage(false);
      setTimeout(() => {
        partialMessageRef.current = "";
        setPartialMessage(partialMessageRef.current);
      }, 500);
    }
  }, []);

  // Combined event handler
  const onEvent = useCallback((event: ServerEvent) => {
    handleServerEvent(event);
    handlePartialMessages(event);
  }, [handleServerEvent, handlePartialMessages]);

  const { connected, sendEvent } = useIPC(onEvent);
  const { handleStartFromModal } = usePromptActions(sendEvent);

  const activeSession = activeSessionId ? sessions[activeSessionId] : undefined;
  const messages = activeSession?.messages ?? [];
  const permissionRequests = activeSession?.permissionRequests ?? [];
  const isRunning = activeSession?.status === "running";

  useEffect(() => {
    if (connected) sendEvent({ type: "session.list" });
  }, [connected, sendEvent]);

  useEffect(() => {
    if (!activeSessionId || !connected) return;
    const session = sessions[activeSessionId];
    if (session && !session.hydrated && !historyRequested.has(activeSessionId)) {
      markHistoryRequested(activeSessionId);
      sendEvent({ type: "session.history", payload: { sessionId: activeSessionId } });
    }
  }, [activeSessionId, connected, sessions, historyRequested, markHistoryRequested, sendEvent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partialMessage]);

  const handleNewSession = useCallback(() => {
    useAppStore.getState().setActiveSessionId(null);
    setShowStartModal(true);
  }, [setShowStartModal]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    sendEvent({ type: "session.delete", payload: { sessionId } });
  }, [sendEvent]);

  const handlePermissionResult = useCallback((toolUseId: string, result: PermissionResult) => {
    if (!activeSessionId) return;
    sendEvent({ type: "permission.response", payload: { sessionId: activeSessionId, toolUseId, result } });
    resolvePermissionRequest(activeSessionId, toolUseId);
  }, [activeSessionId, sendEvent, resolvePermissionRequest]);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar - collapsible with compact mode */}
      {sidebarCollapsed ? (
        <CompactSidebar
          connected={connected}
          onNewSession={handleNewSession}
          onOpenSettings={() => setShowSettingsModal(true)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onExpand={() => setSidebarCollapsed(false)}
        />
      ) : (
        <Sidebar
          connected={connected}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onOpenSettings={() => setShowSettingsModal(true)}
          isOpen={sidebarOpen}
          onClose={() => { setSidebarOpen(false); setSidebarCollapsed(true); }}
          onCollapse={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Right Panel - File Explorer & Terminal */}
      <ResizablePanel
        defaultWidth={320}
        minWidth={280}
        maxWidth={500}
        side="right"
        className={`border-l border-ink-900/10 bg-surface-secondary/30 ${rightPanelOpen ? '' : 'hidden'}`}
      >
        <div className="flex flex-col h-full">
          {/* Right Panel Tabs */}
          <div className="flex items-center border-b border-ink-900/10 px-2">
            <button
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                rightPanelTab === 'files'
                  ? "text-accent-600 border-accent-500"
                  : "text-muted hover:text-ink-600 border-transparent"
              }`}
              onClick={() => setRightPanelTab('files')}
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                Files
              </span>
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                rightPanelTab === 'terminal'
                  ? "text-accent-600 border-accent-500"
                  : "text-muted hover:text-ink-600 border-transparent"
              }`}
              onClick={() => setRightPanelTab('terminal')}
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
                Terminal
              </span>
            </button>
            <button
              className="ml-auto p-2 text-muted hover:text-ink-600 hover:bg-surface-secondary rounded-lg transition-colors"
              onClick={() => setRightPanelOpen(false)}
              aria-label="Close panel"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'files' ? (
              <div className="h-full overflow-y-auto">
                <FileTree rootPath={cwd || defaultCwd} onFileSelect={(path) => console.log('File selected:', path)} />
              </div>
            ) : (
              <div className="h-full">
                <Terminal cwd={cwd || defaultCwd} className="h-full" onCommand={(cmd) => console.log('Command:', cmd)} />
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>

      {/* Main content area */}
      <main className={`flex-1 flex flex-col min-w-0 bg-surface-cream pt-12 lg:pt-0 h-full transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[200px]'
      } ${rightPanelOpen ? 'mr-[320px]' : ''}`}>
        {/* Header bar with drag region */}
        <header
          className="flex items-center justify-between h-16 px-4 border-b border-ink-900/10 bg-surface-cream select-none shrink-0 cursor-move"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {/* Left section */}
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg text-ink-500 hover:text-ink-700 hover:bg-surface-secondary transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Ready</span>
            </div>
          </div>

          {/* Center - Session Title */}
          <h1 className="text-sm font-medium text-ink-700 truncate max-w-xs lg:max-w-md">
            {activeSession?.title || "Coworker"}
          </h1>

          {/* Right section - Toolbar */}
          <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            {/* Toggle Files Panel */}
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${
                rightPanelOpen && rightPanelTab === 'files'
                  ? "text-accent-600 bg-accent-50 shadow-sm"
                  : "text-ink-500 hover:text-ink-700 hover:bg-surface-secondary hover:shadow-sm"
              }`}
              title="Toggle File Explorer"
              onClick={() => {
                if (rightPanelOpen && rightPanelTab === 'files') {
                  setRightPanelOpen(false);
                } else {
                  setRightPanelOpen(true);
                  setRightPanelTab('files');
                }
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
            </button>

            {/* Toggle Terminal Panel */}
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${
                rightPanelOpen && rightPanelTab === 'terminal'
                  ? "text-accent-600 bg-accent-50 shadow-sm"
                  : "text-ink-500 hover:text-ink-700 hover:bg-surface-secondary hover:shadow-sm"
              }`}
              title="Toggle Terminal"
              onClick={() => {
                if (rightPanelOpen && rightPanelTab === 'terminal') {
                  setRightPanelOpen(false);
                } else {
                  setRightPanelOpen(true);
                  setRightPanelTab('terminal');
                }
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-ink-900/10 mx-1" />

            {/* Settings */}
            <button
              className="p-2 rounded-lg text-ink-500 hover:text-ink-700 hover:bg-surface-secondary hover:shadow-sm transition-all duration-200"
              title="Settings"
              onClick={() => setShowSettingsModal(true)}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 pb-32 pt-6 sm:px-6 lg:px-8 bg-surface-cream dark:bg-surface">
          <div className="mx-auto max-w-4xl xl:max-w-5xl">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-[#0F0F1A] flex items-center justify-center mb-6 shadow-xl border border-white/5">
                  <svg className="h-10 w-10" viewBox="0 0 512 512" fill="none">
                    <path d="M360 160C330 130 290 120 245 120C165 120 105 180 105 256C105 332 165 392 245 392C290 392 330 382 360 352"
                      stroke="#F5A623" strokeWidth="56" strokeLinecap="round" />
                    <rect x="250" y="232" width="130" height="48" rx="24" fill="#F5A623" />
                  </svg>
                </div>
                <div className="text-xl font-semibold text-ink-800 mb-2">Welcome to Coworker</div>
                <p className="text-sm text-muted max-w-md mb-8 leading-relaxed">
                  Start a new session to collaborate with Claude Code. Describe your task, and we'll get started building something amazing together.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleNewSession}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Start New Session
                  </button>
                  <button
                    onClick={() => { setRightPanelOpen(true); setRightPanelTab('files'); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-ink-900/10 bg-surface hover:bg-surface-secondary text-ink-700 text-sm font-medium transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                    Browse Files
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, idx) => {
                  const isUserMessage = msg.type === "user_prompt";
                  const previousMessage = idx > 0 ? messages[idx - 1] : null;
                  const isPreviousAssistant = previousMessage && previousMessage.type !== "user_prompt";
                  const shouldAddSeparator = isUserMessage && isPreviousAssistant && idx > 0;

                  return (
                    <div key={idx}>
                      {shouldAddSeparator && (
                        <div className="flex items-center gap-4 py-8">
                          <div className="flex-1 h-px bg-ink-900/10"></div>
                          <div className="text-xs text-muted font-medium">New Conversation</div>
                          <div className="flex-1 h-px bg-ink-900/10"></div>
                        </div>
                      )}
                      <MessageCard
                        message={msg}
                        isLast={idx === messages.length - 1}
                        isRunning={isRunning}
                        permissionRequest={permissionRequests[0]}
                        onPermissionResult={handlePermissionResult}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Partial message display with skeleton loading */}
            <div className={`partial-message transition-opacity duration-300 ${partialMessage ? 'opacity-100' : 'opacity-0'}`}>
              <div className="animate-fade-in">
                <MDContent text={partialMessage} />
              </div>
              {showPartialMessage && (
                <div className="mt-4 flex flex-col gap-2.5 px-1 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
                    <span className="text-sm text-ink-500 font-medium">Claude is thinking...</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-2/5 rounded-lg bg-gradient-to-r from-ink-900/10 via-ink-900/5 to-ink-900/10 animate-shimmer" />
                    <div className="h-4 w-full rounded-lg bg-gradient-to-r from-ink-900/10 via-ink-900/5 to-ink-900/10 animate-shimmer" style={{ animationDelay: '0.1s' }} />
                    <div className="h-4 w-4/5 rounded-lg bg-gradient-to-r from-ink-900/10 via-ink-900/5 to-ink-900/10 animate-shimmer" style={{ animationDelay: '0.2s' }} />
                    <div className="h-4 w-3/5 rounded-lg bg-gradient-to-r from-ink-900/10 via-ink-900/5 to-ink-900/10 animate-shimmer" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Prompt input */}
        <PromptInput sendEvent={sendEvent} />
      </main>

      {/* Modals */}
      {showStartModal && (
        <StartSessionModal
          cwd={cwd}
          prompt={prompt}
          pendingStart={pendingStart}
          onCwdChange={setCwd}
          onPromptChange={setPrompt}
          onStart={handleStartFromModal}
          onClose={() => setShowStartModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer />

      {/* Global error toast (deprecated, use Toast instead) */}
      {globalError && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-error/20 bg-error-light px-4 py-3 shadow-lg animate-scale-in">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-error font-medium">{globalError}</span>
            <button
              className="p-1 rounded hover:bg-error/10 transition-colors"
              onClick={() => setGlobalError(null)}
            >
              <svg className="h-4 w-4 text-error" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
