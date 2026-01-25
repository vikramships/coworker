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

  return {
    state: {
      editorTabs,
      activeTabId,
      showFileExplorer,
      searchQuery,
    },
    actions: {
      addTab,
      closeTab,
      setActiveTab,
      updateTabContent,
      markTabSaved,
      toggleFileExplorer,
      setSearchQuery,
      setEditorTabs,
    },
  };
}