import { useEffect } from 'react';

export interface SessionState {
  activeSessionId: string | null;
  sessions: Record<string, any>;
  sidebarOpen: boolean;
  theme: string;
  cwd: string;
}

const SESSION_STORAGE_KEY = 'coworker-session-state';
const SESSION_BACKUP_KEY = 'coworker-session-backup';

export function useSessionPersistence() {
  // Save session state
  const saveSessionState = (state: Partial<SessionState>) => {
    try {
      const currentState = loadSessionState();
      const newState = { ...currentState, ...state, lastSaved: Date.now() };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newState));

      // Also save a backup every 5 minutes
      const lastBackup = localStorage.getItem(SESSION_BACKUP_KEY);
      if (!lastBackup || Date.now() - JSON.parse(lastBackup).timestamp > 5 * 60 * 1000) {
        localStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify({
          ...newState,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.warn('Failed to save session state:', error);
    }
  };

  // Load session state
  const loadSessionState = (): Partial<SessionState> => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load session state:', error);
      return {};
    }
  };

  // Clear session state
  const clearSessionState = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear session state:', error);
    }
  };

  // Auto-save functionality
  const useAutoSave = (state: Partial<SessionState>, delay: number = 1000) => {
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        saveSessionState(state);
      }, delay);

      return () => clearTimeout(timeoutId);
    }, [state, delay]);
  };

  return {
    saveSessionState,
    loadSessionState,
    clearSessionState,
    useAutoSave
  };
}

// Hook for managing session history
export function useSessionHistory() {
  const saveSessionToHistory = (sessionId: string, session: any) => {
    try {
      const history = loadSessionHistory();
      history[sessionId] = {
        ...session,
        savedAt: Date.now()
      };

      // Keep only last 50 sessions
      const entries = Object.entries(history)
        .sort(([, a], [, b]) => (b as any).savedAt - (a as any).savedAt)
        .slice(0, 50);

      localStorage.setItem('coworker-session-history', JSON.stringify(Object.fromEntries(entries)));
    } catch (error) {
      console.warn('Failed to save session to history:', error);
    }
  };

  const loadSessionHistory = (): Record<string, any> => {
    try {
      const saved = localStorage.getItem('coworker-session-history');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load session history:', error);
      return {};
    }
  };

  const getRecentSessions = (limit: number = 10): any[] => {
    const history = loadSessionHistory();
    return Object.values(history)
      .sort((a: any, b: any) => b.savedAt - a.savedAt)
      .slice(0, limit);
  };

  return {
    saveSessionToHistory,
    loadSessionHistory,
    getRecentSessions
  };
}