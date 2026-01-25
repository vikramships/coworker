import { useState, useEffect, useCallback, useMemo } from 'react';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileItem[];
  expanded?: boolean;
  isFavorite?: boolean;
  size?: number;
  mtime?: number;
}

interface FileTreeProps {
  rootPath: string;
  onFileSelect?: (filePath: string) => void;
  onFileContextMenu?: (filePath: string, event: React.MouseEvent) => void;
}

type FilterType = 'all' | 'files' | 'directories';

const FILE_ICONS: Record<string, string> = {
  '.ts': '🟦',
  '.tsx': '🔵',
  '.js': '🟨',
  '.jsx': '🟨',
  '.py': '🐍',
  '.rs': '🦀',
  '.go': '🐹',
  '.java': '☕',
  '.cpp': '🔧',
  '.c': '🔧',
  '.h': '📋',
  '.hpp': '📋',
  '.css': '🎨',
  '.scss': '🎨',
  '.html': '🌐',
  '.xml': '📄',
  '.json': '📋',
  '.yaml': '📄',
  '.yml': '📄',
  '.md': '📝',
  '.txt': '📄',
  '.sh': '⚡',
  '.bash': '⚡',
  '.zsh': '⚡',
  '.sql': '🗄️',
  '.gitignore': '🚫',
  '.env': '🔒',
  '.png': '🖼️',
  '.jpg': '🖼️',
  '.jpeg': '🖼️',
  '.gif': '🖼️',
  '.svg': '🖼️',
  '.ico': '🖼️',
  '.zip': '📦',
  '.tar': '📦',
  '.gz': '📦',
  '.rar': '📦',
  '.toml': '⚙️',
  '.ini': '⚙️',
  '.conf': '⚙️',
  'file': '📄',
  'directory': '📁',
  'directory-open': '📂',
};

function getFileIcon(fileName: string, isDirectory: boolean, isOpen?: boolean): string {
  if (isDirectory) return isOpen ? FILE_ICONS['directory-open'] : FILE_ICONS['directory'];
  const ext = fileName.substring(fileName.lastIndexOf('.'));
  return FILE_ICONS[ext] || FILE_ICONS['file'];
}

function filterFileTree(items: FileItem[], searchQuery: string, filterType: FilterType): FileItem[] {
  const query = searchQuery.toLowerCase();
  
  const filterItem = (item: FileItem): FileItem | null => {
    const matchesSearch = item.name.toLowerCase().includes(query);
    const matchesType = filterType === 'all' || (filterType === 'files' && item.type === 'file') || (filterType === 'directories' && item.type === 'directory');
    
    if (!matchesType && query === '') return null;
    
    if (item.type === 'directory' && item.children) {
      const filteredChildren = item.children.map(filterItem).filter(Boolean) as FileItem[];
      
      if (filteredChildren.length > 0 || matchesSearch) {
        return {
          ...item,
          children: filteredChildren,
          expanded: true
        };
      }
    }
    
    if (matchesSearch && matchesType) {
      return { ...item };
    }
    
    return null;
  };
  
  return items.map(filterItem).filter(Boolean) as FileItem[];
}

function FileTreeItem({
  item,
  level = 0,
  onSelect,
  onContextMenu,
  onToggle,
  onFavoriteToggle,
  selectedPath,
  onSelectedChange
}: {
  item: FileItem;
  level?: number;
  onSelect?: (filePath: string) => void;
  onContextMenu?: (filePath: string, event: React.MouseEvent) => void;
  onToggle?: (path: string) => void;
  onFavoriteToggle?: (path: string) => void;
  selectedPath: string | null;
  onSelectedChange: (path: string | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(item.expanded || false);
  const isDirectory = item.type === 'directory';

  const handleClick = () => {
    onSelectedChange(item.path);
    if (isDirectory) {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      onToggle?.(item.path);
    } else {
      onSelect?.(item.path);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    onContextMenu?.(item.path, event);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(item.path);
  };

  const icon = getFileIcon(item.name, isDirectory, isExpanded);
  const isSelected = selectedPath === item.path;

  return (
    <div>
      <div
        className={`flex items-center py-1.5 px-2 hover:bg-surface-secondary cursor-pointer select-none transition-colors ${
          level > 0 ? '' : ''
        } ${isSelected ? 'bg-accent-500/10 border-l-2 border-accent-500' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {isDirectory && (
          <span className="mr-1.5 text-xs text-muted transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
        )}
        {!isDirectory && <span className="w-3 mr-1.5" />}
        <span className="mr-2 text-sm">
          {icon}
        </span>
        <span className="text-sm truncate flex-1" title={item.name}>
          {item.name}
        </span>
        {item.isFavorite && (
          <button
            onClick={handleFavoriteClick}
            className="ml-2 text-yellow-500 hover:text-yellow-600 transition-colors"
            title="Remove from favorites"
          >
            ★
          </button>
        )}
        {!item.isFavorite && isDirectory && (
          <button
            onClick={handleFavoriteClick}
            className="ml-2 text-muted-light hover:text-yellow-500 transition-colors"
            title="Add to favorites"
          >
            ☆
          </button>
        )}
      </div>

      {isDirectory && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onToggle={onToggle}
              onFavoriteToggle={onFavoriteToggle}
              selectedPath={selectedPath}
              onSelectedChange={onSelectedChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ rootPath, onFileSelect, onFileContextMenu }: FileTreeProps) {
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const loadFileTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electron.listFiles(rootPath);
      if (result.success && result.items) {
        const buildTree = async (items: Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }>, depth = 0): Promise<FileItem[]> => {
          if (depth > 3) return [];

          const fileItems: FileItem[] = [];
          for (const item of items) {
            if (item.name.startsWith('.')) continue;

            const fileItem: FileItem = {
              name: item.name,
              path: item.path,
              type: item.isDirectory ? 'directory' : 'file',
              isFavorite: favorites.has(item.path)
            };

            if (item.isDirectory) {
              const subResult = await window.electron.listFiles(item.path);
              if (subResult.success && subResult.items) {
                fileItem.children = await buildTree(subResult.items, depth + 1);
              }
            }

            fileItems.push(fileItem);
          }
          return fileItems;
        };

        const tree = await buildTree(result.items);
        setFileTree(tree);
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (error) {
      setError('Failed to load file tree');
      console.error('Failed to load file tree:', error);
    } finally {
      setLoading(false);
    }
  }, [rootPath, favorites]);

  useEffect(() => {
    loadFileTree();
  }, [rootPath]);

  const toggleFavorite = (path: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(path)) {
      newFavorites.delete(path);
    } else {
      newFavorites.add(path);
    }
    setFavorites(newFavorites);
    
    const updateFavorites = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.path === path) {
          return { ...item, isFavorite: newFavorites.has(path) };
        }
        if (item.children) {
          return { ...item, children: updateFavorites(item.children) };
        }
        return item;
      });
    };
    
    setFileTree(prev => updateFavorites(prev));
  };

  const handleToggle = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
    
    const updateExpanded = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.path === path) {
          return { ...item, expanded: newExpanded.has(path) };
        }
        if (item.children) {
          return { ...item, children: updateExpanded(item.children) };
        }
        return item;
      });
    };
    
    setFileTree(prev => updateExpanded(prev));
  };

  const expandAll = () => {
    const expandRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.type === 'directory') {
          return {
            ...item,
            expanded: true,
            children: item.children ? expandRecursive(item.children) : undefined
          };
        }
        return item;
      });
    };
    setFileTree(expandRecursive);
    setExpandedPaths(new Set(fileTree.filter(i => i.type === 'directory').map(i => i.path)));
  };

  const collapseAll = () => {
    const collapseRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.type === 'directory') {
          return {
            ...item,
            expanded: false,
            children: item.children ? collapseRecursive(item.children) : undefined
          };
        }
        return item;
      });
    };
    setFileTree(collapseRecursive);
    setExpandedPaths(new Set());
  };

  const filteredTree = useMemo(() => {
    return filterFileTree(fileTree, searchQuery, filterType);
  }, [fileTree, searchQuery, filterType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-3 border-b border-ink-900/5">
        <div className="mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full px-3 py-2 text-sm border border-ink-900/10 rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-1">
            {(['all', 'files', 'directories'] as FilterType[]).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-1 text-xs font-medium rounded capitalize transition-colors ${
                  filterType === type
                    ? 'bg-accent-500 text-white'
                    : 'bg-surface-secondary text-muted hover:text-ink-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="p-1.5 rounded hover:bg-surface-secondary transition-colors text-muted hover:text-ink-700"
              title="Expand all"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            <button
              onClick={collapseAll}
              className="p-1.5 rounded hover:bg-surface-secondary transition-colors text-muted hover:text-ink-700"
              title="Collapse all"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18,15 12,9 6,15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-4 h-4 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-4 h-4 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm text-muted">Loading files...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="h-12 w-12 text-error/50 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-error mb-2">{error}</p>
            <button
              onClick={loadFileTree}
              className="px-3 py-1.5 text-xs bg-surface-secondary hover:bg-surface-secondary/80 rounded transition-colors"
            >
              Try again
            </button>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="h-16 w-16 text-muted-light mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            <p className="text-sm text-muted">
              {searchQuery ? 'No files found' : 'This directory is empty'}
            </p>
          </div>
        ) : (
          filteredTree.map((item) => (
            <FileTreeItem
              key={item.path}
              item={item}
              onSelect={onFileSelect}
              onContextMenu={onFileContextMenu}
              onToggle={handleToggle}
              onFavoriteToggle={toggleFavorite}
              selectedPath={selectedPath}
              onSelectedChange={setSelectedPath}
            />
          ))
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-2 border-t border-ink-900/5 bg-surface-secondary/50 flex items-center justify-between text-xs text-muted">
        <span>{filteredTree.length} items</span>
        <span>{rootPath}</span>
      </div>
    </div>
  );
}