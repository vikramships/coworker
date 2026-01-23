import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientEvent } from "../types";
import { useAppStore, useShallow } from "../store/useAppStore";

const DEFAULT_ALLOWED_TOOLS = "Read,Edit,Bash";


interface PromptInputProps {
  sendEvent: (event: ClientEvent) => void;
}

// Single selector with shallow comparison to prevent multiple re-renders
function usePromptActionsState() {
  return useAppStore(useShallow((state) => ({
    cwd: state.cwd,
    activeSessionId: state.activeSessionId,
    sessions: state.sessions,
    setPendingStart: state.setPendingStart,
    setGlobalError: state.setGlobalError
  })));
}

export function usePromptActions(sendEvent: (event: ClientEvent) => void) {
  const { cwd, activeSessionId, sessions, setPendingStart, setGlobalError } = usePromptActionsState();

  const activeSession = activeSessionId ? sessions[activeSessionId] : undefined;
  const isRunning = activeSession?.status === "running";

  // Read prompt directly from store to avoid recreating callback on every keystroke
  const handleSend = useCallback(async (currentPrompt: string) => {
    if (!currentPrompt.trim()) return;

    if (!activeSessionId) {
      let title = "";
      try {
        setPendingStart(true);
        title = await window.electron.generateSessionTitle(currentPrompt);
      } catch (error) {
        console.error(error);
        setPendingStart(false);
        setGlobalError("Failed to get session title.");
        return;
      }
      sendEvent({
        type: "session.start",
        payload: { title, prompt: currentPrompt, cwd: cwd.trim() || undefined, allowedTools: DEFAULT_ALLOWED_TOOLS }
      });
    } else {
      if (activeSession?.status === "running") {
        setGlobalError("Session is still running. Please wait for it to finish.");
        return;
      }
      sendEvent({ type: "session.continue", payload: { sessionId: activeSessionId, prompt: currentPrompt } });
    }
  }, [activeSession, activeSessionId, cwd, sendEvent, setGlobalError, setPendingStart]);

  const handleStop = useCallback(() => {
    if (!activeSessionId) return;
    sendEvent({ type: "session.stop", payload: { sessionId: activeSessionId } });
  }, [activeSessionId, sendEvent]);

  const handleStartFromModal = useCallback(() => {
    if (!cwd.trim()) {
      setGlobalError("Working Directory is required to start a session.");
      return;
    }
    const currentPrompt = useAppStore.getState().prompt;
    handleSend(currentPrompt);
  }, [cwd, handleSend, setGlobalError]);

  return { isRunning, handleSend, handleStop, handleStartFromModal };
}

export function PromptInput({ sendEvent }: PromptInputProps) {
  const { isRunning, handleSend, handleStop } = usePromptActions(sendEvent);
  const [localValue, setLocalValue] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync initial prompt if any (e.g. from modal)
  const storePrompt = useAppStore(s => s.prompt);
  const prevStorePromptRef = useRef(storePrompt);
  useEffect(() => {
    // Only sync when storePrompt changes from a non-empty value
    if (storePrompt && storePrompt !== prevStorePromptRef.current && storePrompt !== localValue) {
      setLocalValue(storePrompt);
      // Clear store prompt after syncing
      useAppStore.getState().setPrompt("");
    }
    prevStorePromptRef.current = storePrompt;
  }, [storePrompt, localValue]);

  const adjustHeight = () => {
    const textarea = promptRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [localValue, attachments]);

  const handleSelectImage = async () => {
    try {
      const result = await window.electron.selectImage();
      if (result) {
        setAttachments(prev => [...prev, result]);
      }
    } catch (error) {
      console.error("Failed to select image:", error);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSend = () => {
    if (localValue.trim() || attachments.length > 0) {
      handleSend(localValue);
      setLocalValue("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    if (isRunning) { handleStop(); return; }
    onSend();
  };

  return (
    <section className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-surface via-surface/95 to-transparent pb-6 px-4 lg:pb-10 pt-16 z-40 lg:ml-[260px] ml-0 pointer-events-none">
      <div className="mx-auto flex w-full max-w-full flex-col rounded-2xl border border-ink-900/10 glass shadow-2xl transition-all duration-300 focus-within:shadow-glow lg:max-w-3xl pointer-events-auto bg-surface/50">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative group">
                <img
                  src={attachment}
                  alt={`Attachment ${index + 1}`}
                  className="h-16 w-16 rounded-lg object-cover border border-ink-900/10"
                />
                <button
                  onClick={() => handleRemoveAttachment(index)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-error text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm hover:bg-error/90"
                  aria-label="Remove attachment"
                >
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l6 6M9 3l-6 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3 p-2 pl-4">
          {/* Image upload button */}
          <button
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
              attachments.length > 0
                ? "bg-accent-500/10 text-accent-500 hover:bg-accent-500 hover:text-white"
                : "bg-surface-tertiary text-ink-400 hover:text-ink-600 hover:bg-surface-secondary"
            }`}
            onClick={handleSelectImage}
            aria-label="Attach image"
            title="Attach image"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>

          <textarea
            rows={1}
            className="flex-1 resize-none bg-transparent py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0 focus:border-transparent transition-colors duration-200 leading-relaxed min-h-[44px] max-h-[200px]"
            placeholder="Ask Kai to build something..."
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={promptRef}
          />
          <button
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 transform active:scale-90 shadow-lg ${isRunning
              ? "bg-error text-white hover:bg-error/90 hover:shadow-error/20"
              : localValue.trim() || attachments.length > 0
                ? "bg-accent-500 text-white hover:bg-accent-600 hover:shadow-glow"
                : "bg-surface-tertiary text-ink-400 cursor-not-allowed"
              }`}
            onClick={isRunning ? handleStop : onSend}
            disabled={!isRunning && !localValue.trim() && attachments.length === 0}
            aria-label={isRunning ? "Stop session" : "Send prompt"}
          >
            {isRunning ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}