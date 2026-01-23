import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const matches =
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.metaKey === !!shortcut.metaKey;

      if (matches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
          event.stopPropagation();
        }
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}

// Common shortcuts configuration
export const createCommonShortcuts = (actions: {
  onNewSession?: () => void;
  onSaveFile?: () => void;
  onOpenFile?: () => void;
  onToggleTerminal?: () => void;
  onToggleFileExplorer?: () => void;
  onFocusPrompt?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
  onCloseTab?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onNewSession) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      action: actions.onNewSession,
      description: 'New session',
    });
  }

  if (actions.onSaveFile) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      action: actions.onSaveFile,
      description: 'Save file',
    });
  }

  if (actions.onOpenFile) {
    shortcuts.push({
      key: 'o',
      ctrlKey: true,
      action: actions.onOpenFile,
      description: 'Open file',
    });
  }

  if (actions.onToggleTerminal) {
    shortcuts.push({
      key: 'j',
      ctrlKey: true,
      action: actions.onToggleTerminal,
      description: 'Toggle terminal',
    });
  }

  if (actions.onToggleFileExplorer) {
    shortcuts.push({
      key: 'b',
      ctrlKey: true,
      action: actions.onToggleFileExplorer,
      description: 'Toggle file explorer',
    });
  }

  if (actions.onFocusPrompt) {
    shortcuts.push({
      key: 'l',
      ctrlKey: true,
      action: actions.onFocusPrompt,
      description: 'Focus prompt input',
    });
  }

  if (actions.onNextTab) {
    shortcuts.push({
      key: 'Tab',
      ctrlKey: true,
      action: actions.onNextTab,
      description: 'Next tab',
    });
  }

  if (actions.onPrevTab) {
    shortcuts.push({
      key: 'Tab',
      ctrlKey: true,
      shiftKey: true,
      action: actions.onPrevTab,
      description: 'Previous tab',
    });
  }

  if (actions.onCloseTab) {
    shortcuts.push({
      key: 'w',
      ctrlKey: true,
      action: actions.onCloseTab,
      description: 'Close tab',
    });
  }

  return shortcuts;
};

// Format shortcut for display
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'action' | 'description'>): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('Cmd');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}