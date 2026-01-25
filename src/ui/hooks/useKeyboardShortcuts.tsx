import { useEffect, useCallback } from "react";

export type KeyboardAction = 
  | "toggle-command-palette"
  | "toggle-files"
  | "toggle-sidebar"
  | "new-session"
  | "open-settings"
  | "go-to-chat";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: KeyboardAction;
  description: string;
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: "k", ctrl: true, action: "toggle-command-palette", description: "Open command palette" },
  { key: "e", ctrl: true, shift: true, action: "toggle-files", description: "Toggle file explorer" },
  { key: "b", ctrl: true, action: "toggle-sidebar", description: "Toggle sidebar" },
  { key: "n", ctrl: true, action: "new-session", description: "New session" },
  { key: ",", ctrl: true, action: "open-settings", description: "Open settings" },
  { key: "/", ctrl: true, action: "go-to-chat", description: "Focus chat input" },
];

export function useKeyboardShortcuts(
  handlers: Partial<Record<KeyboardAction, () => void>>,
  enabled = true
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
    if (isInput && e.key.length === 1) return;

    for (const shortcut of DEFAULT_SHORTCUTS) {
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey && !e.metaKey;
      const metaMatch = shortcut.meta ? e.metaKey : true;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === shortcut.key;

      if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        const handler = handlers[shortcut.action];
        if (handler) handler();
        return;
      }
    }
  }, [handlers, enabled]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return DEFAULT_SHORTCUTS;
}

export function KeyboardShortcutIndicator({ shortcut }: { shortcut: KeyboardShortcut }) {
  const keys: string[] = [];
  if (shortcut.ctrl || shortcut.meta) keys.push(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
  if (shortcut.shift) keys.push("⇧");
  if (shortcut.alt) keys.push(navigator.platform.includes("Mac") ? "⌥" : "Alt");
  keys.push(shortcut.key.toUpperCase());

  return (
    <kbd className="px-1.5 py-0.5 bg-surface-secondary border border-ink-900/10 rounded text-xs font-mono text-muted">
      {keys.join("+")}
    </kbd>
  );
}
