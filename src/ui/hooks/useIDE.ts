import { useCallback, useState } from 'react';

export function useIDE() {
  const [editorTabs, setEditorTabs] = useState<Array<{
    id: string;
    title: string;
    content: string;
    language: string;
    isDirty: boolean;
  }>>([]);

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const addTab = useCallback((tab: {
    id: string;
    title: string;
    content: string;
    language: string;
  }) => {
    const newTab = {
      ...tab,
      id: `tab-${Date.now()}`,
      isDirty: false,
    };
    setEditorTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setEditorTabs(prev => {
      const remaining = prev.filter(tab => tab.id !== tabId);
      if (activeTabId === tabId && remaining.length > 0) {
        setActiveTabId(remaining[remaining.length - 1].id);
      }
      return remaining;
    });
  }, [activeTabId]);

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setEditorTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, content, isDirty: true } : tab
    ));
  }, []);

  const markTabSaved = useCallback((tabId: string) => {
    setEditorTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, isDirty: false } : tab
    ));
  }, []);

  const toggleFileExplorer = useCallback(() => {
    setShowFileExplorer(prev => !prev);
  }, []);

  const toggleTerminal = useCallback(() => {
    setShowTerminal(prev => !prev);
  }, []);

  const createNewTerminalTab = useCallback(() => {
    const newTabId = Date.now().toString();
    setActiveTabId(newTabId);
    setEditorTabs(prev => [
      ...prev,
      {
        id: newTabId,
        title: `Terminal ${prev.filter(t => t.id.startsWith('Terminal')).length + 1}`,
        content: `New terminal tab created`,
        language: 'bash',
        isDirty: false,
      }
    ]);
  }, [editorTabs]);

  return {
    state: {
      editorTabs,
      activeTabId,
      showFileExplorer,
      showTerminal,
      searchQuery,
    },
    actions: {
      addTab,
      closeTab,
      setActiveTab,
      updateTabContent,
      markTabSaved,
      toggleFileExplorer,
      toggleTerminal,
      createNewTerminalTab,
      setSearchQuery,
      setEditorTabs,
    },
  };
}