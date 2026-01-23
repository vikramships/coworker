import { useState, useCallback, useEffect } from 'react';
import { useFd } from '../hooks/useFd';
import { useRg } from '../hooks/useRg';
import { useScout } from '../hooks/useScout';
import type { RgMatch, FdFileInfo, ScoutSearchResult } from '../types';

interface SearchPanelProps {
  rootPath: string;
  className?: string;
  onResultClick?: (path: string, line?: number) => void;
}

type SearchMode = 'files' | 'content';

export function SearchPanel({ rootPath, className = '', onResultClick }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('files');
  const [fileExt, setFileExt] = useState('');
  const [results, setResults] = useState<Array<RgMatch | FdFileInfo | ScoutSearchResult>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchEngine, setSearchEngine] = useState<'fd' | 'rg' | 'scout'>('fd');

  const fd = useFd();
  const rg = useRg();
  const scout = useScout();

  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let searchResults: any[] = [];

      if (searchMode === 'files') {
        if (searchEngine === 'fd') {
          const options = {
            limit: 100,
            ...(fileExt && { ext: fileExt })
          };
          searchResults = await fd.find(rootPath, query, options);
        } else if (searchEngine === 'scout') {
          searchResults = await scout.find(rootPath, query, 100);
        }
      } else {
        if (searchEngine === 'rg') {
          const options = {
            limit: 100,
            ...(fileExt && { ext: fileExt })
          };
          searchResults = await rg.search(rootPath, query, options);
        } else if (searchEngine === 'scout') {
          searchResults = await scout.search(rootPath, query, {
            ext: fileExt,
            limit: 100
          });
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, searchMode, searchEngine, fileExt, rootPath, fd, rg, scout]);

  useEffect(() => {
    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, performSearch]);

  const handleResultClick = (result: any) => {
    const path = result.path;
    const line = result.line;
    onResultClick?.(path, line);
  };

  const isContentResult = (result: any): result is RgMatch => {
    return 'line' in result && 'content' in result;
  };

  const getFileIcon = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      ts: '🟦', tsx: '🔵', js: '🟨', jsx: '🟨',
      py: '🐍', rs: '🦀', go: '🐹', java: '☕',
      css: '🎨', scss: '🎨', html: '🌐',
      json: '📋', yaml: '📄', yml: '📄',
      md: '📝', txt: '📄', sh: '⚡'
    };
    return icons[ext || ''] || '📄';
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-3 border-b border-ink-900/5">
        <div className="mb-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchMode === 'files' ? 'Search files...' : 'Search content...'}
            className="w-full px-3 py-2 text-sm border border-ink-900/10 rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchMode('files')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                searchMode === 'files'
                  ? 'bg-accent-500 text-white'
                  : 'bg-surface-secondary text-muted hover:text-ink-700'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setSearchMode('content')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                searchMode === 'content'
                  ? 'bg-accent-500 text-white'
                  : 'bg-surface-secondary text-muted hover:text-ink-700'
              }`}
            >
              Content
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Engine:</span>
            <select
              value={searchEngine}
              onChange={(e) => setSearchEngine(e.target.value as any)}
              className="px-2 py-1 text-xs border border-ink-900/10 rounded bg-surface focus:outline-none"
            >
              {searchMode === 'files' ? (
                <>
                  <option value="fd">FD (fast)</option>
                  <option value="scout">Scout</option>
                </>
              ) : (
                <>
                  <option value="rg">RG (ripgrep)</option>
                  <option value="scout">Scout</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">File extension:</span>
          <input
            type="text"
            value={fileExt}
            onChange={(e) => setFileExt(e.target.value)}
            placeholder="ts,tsx,js..."
            className="flex-1 px-2 py-1 text-xs border border-ink-900/10 rounded bg-surface focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
          </div>
        ) : query && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="h-16 w-16 text-muted-light mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm text-muted">No results found</p>
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-ink-900/5">
            {results.map((result, idx) => (
              <div
                key={`${result.path}-${idx}`}
                onClick={() => handleResultClick(result)}
                className="p-3 hover:bg-surface-secondary cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">{getFileIcon(result.path)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">
                      {result.path.replace(rootPath + '/', '')}
                    </div>
                    {isContentResult(result) && (
                      <div className="mt-1 p-2 bg-surface-secondary rounded text-xs font-mono">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-accent-500">Line {result.line}</span>
                        </div>
                        <div className="text-muted whitespace-pre-wrap break-all">
                          {result.content.trim()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="h-16 w-16 text-muted-light mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm text-muted">
              {searchMode === 'files' ? 'Search for files by name' : 'Search file contents'}
            </p>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-ink-900/5 bg-surface-secondary/50 flex items-center justify-between text-xs text-muted">
        <span>
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </span>
        <span>{rootPath}</span>
      </div>
    </div>
  );
}