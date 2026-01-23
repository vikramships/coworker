import { useState, useEffect } from 'react';
import { DiffViewer } from './DiffViewer';

interface GitStatusEntry {
  path: string;
  status: 'Modified' | 'Added' | 'Deleted' | 'Untracked' | 'Renamed';
  oldPath?: string;
}

interface GitCommit {
  id: string;
  message: string;
  author: string;
  timestamp: number;
}

interface GitBranch {
  name: string;
  current: boolean;
}

interface GitPanelProps {
  repoPath: string;
  className?: string;
  onFileOpen?: (path: string) => void;
}

type GitTab = 'status' | 'staged' | 'log' | 'diff' | 'branches';

export function GitPanel({ repoPath, className = '', onFileOpen }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatusEntry[]>([]);
  const [staged, setStaged] = useState<GitStatusEntry[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedStagedFiles, setSelectedStagedFiles] = useState<Set<string>>(new Set());
  const [commitMessage, setCommitMessage] = useState('');
  const [activeTab, setActiveTab] = useState<GitTab>('status');
  const [selectedFileForDiff, setSelectedFileForDiff] = useState<GitStatusEntry | null>(null);
  const [diffContent, setDiffContent] = useState<{ old: string; new: string } | null>(null);
  const [newBranchName, setNewBranchName] = useState('');

  useEffect(() => {
    loadGitData();
  }, [repoPath]);

  const loadGitData = async () => {
    setLoading(true);
    try {
      const mockStatus: GitStatusEntry[] = [
        { path: 'src/main.ts', status: 'Modified' },
        { path: 'package.json', status: 'Modified' },
        { path: 'README.md', status: 'Added' },
        { path: 'old-file.ts', status: 'Deleted' },
      ];

      const mockStaged: GitStatusEntry[] = [
        { path: 'src/components/App.tsx', status: 'Modified' },
      ];

      const mockCommits: GitCommit[] = [
        {
          id: 'abc123',
          message: 'Add new feature',
          author: 'John Doe',
          timestamp: Date.now() - 3600000,
        },
        {
          id: 'def456',
          message: 'Fix bug in component',
          author: 'Jane Smith',
          timestamp: Date.now() - 7200000,
        },
        {
          id: 'ghi789',
          message: 'Initial commit',
          author: 'Alice Johnson',
          timestamp: Date.now() - 86400000,
        },
      ];

      const mockBranches: GitBranch[] = [
        { name: 'main', current: true },
        { name: 'develop', current: false },
        { name: 'feature/new-ui', current: false },
      ];

      setStatus(mockStatus);
      setStaged(mockStaged);
      setCommits(mockCommits);
      setBranches(mockBranches);
    } catch (error) {
      console.error('Failed to load Git data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileToggle = (filePath: string, isStaged = false) => {
    const setSelected = isStaged ? setSelectedStagedFiles : setSelectedFiles;
    const current = isStaged ? selectedStagedFiles : selectedFiles;
    
    const newSelected = new Set(current);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelected(newSelected);
  };

  const stageFiles = async () => {
    if (selectedFiles.size === 0) return;

    try {
      const newStaged = [...staged, ...status.filter(f => selectedFiles.has(f.path))];
      setStaged(newStaged);
      setStatus(status.filter(f => !selectedFiles.has(f.path)));
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('Failed to stage files:', error);
    }
  };

  const unstageFiles = async () => {
    if (selectedStagedFiles.size === 0) return;

    const filesToUnstage = staged.filter(f => selectedStagedFiles.has(f.path));
    
    try {
      const newStatus = [...status, ...filesToUnstage];
      setStatus(newStatus);
      setStaged(staged.filter(f => !selectedStagedFiles.has(f.path)));
      setSelectedStagedFiles(new Set());
    } catch (error) {
      console.error('Failed to unstage files:', error);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || staged.length === 0) return;

    try {
      setCommitMessage('');
      setStaged([]);
      setSelectedStagedFiles(new Set());
      
      const newCommit: GitCommit = {
        id: Math.random().toString(36).substring(2, 9),
        message: commitMessage,
        author: 'You',
        timestamp: Date.now(),
      };
      
      setCommits([newCommit, ...commits]);
    } catch (error) {
      console.error('Failed to commit:', error);
    }
  };

  const handleDiffView = async (file: GitStatusEntry) => {
    setSelectedFileForDiff(file);
    try {
      const oldResult = await window.electron.readFile(file.path + '.orig');
      const newResult = await window.electron.readFile(file.path);
      
      if (oldResult.success && newResult.success) {
        setDiffContent({
          old: oldResult.content || '',
          new: newResult.content || ''
        });
      } else if (newResult.success) {
        setDiffContent({
          old: '',
          new: newResult.content || ''
        });
      }
    } catch (error) {
      console.error('Failed to load diff:', error);
    }
  };

  const switchBranch = async (branchName: string) => {
    try {
      setBranches(branches.map(b => ({ ...b, current: b.name === branchName })));
    } catch (error) {
      console.error('Failed to switch branch:', error);
    }
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) return;

    try {
      const newBranch: GitBranch = {
        name: newBranchName,
        current: false
      };
      setBranches([...branches, newBranch]);
      setNewBranchName('');
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Modified': return '🔄';
      case 'Added': return '➕';
      case 'Deleted': return '➖';
      case 'Untracked': return '❓';
      case 'Renamed': return '↔️';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Modified': return 'text-blue-600';
      case 'Added': return 'text-green-600';
      case 'Deleted': return 'text-red-600';
      case 'Untracked': return 'text-yellow-600';
      case 'Renamed': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-surface border border-ink-900/10 rounded-lg ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-ink-900/5">
        <h3 className="text-sm font-medium text-ink-700">Git</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {branches.find(b => b.current)?.name || 'main'}
          </span>
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
        </div>
      </div>

      <div className="flex border-b border-ink-900/5">
        {[
          { id: 'status' as GitTab, label: 'Changes', count: status.length },
          { id: 'staged' as GitTab, label: 'Staged', count: staged.length },
          { id: 'log' as GitTab, label: 'History', count: commits.length },
          { id: 'branches' as GitTab, label: 'Branches', count: branches.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedFileForDiff(null);
              setDiffContent(null);
            }}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-accent-500 text-accent-600'
                : 'border-transparent text-muted hover:text-ink-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-accent-500/10 text-accent-600 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'status' && (
          <div className="p-3">
            <div className="mb-3">
              <button
                onClick={stageFiles}
                disabled={selectedFiles.size === 0}
                className="w-full px-3 py-2 bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Stage {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''}
              </button>
            </div>
            
            <div className="space-y-1">
              {status.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <p className="text-sm">No changes</p>
                </div>
              ) : (
                status.map((entry) => (
                  <div
                    key={entry.path}
                    className={`flex items-center p-2 rounded hover:bg-surface-secondary cursor-pointer transition-colors ${
                      selectedFiles.has(entry.path) ? 'bg-accent-500/10 border border-accent-500/20' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(entry.path)}
                      onChange={() => handleFileToggle(entry.path)}
                      className="mr-3"
                    />
                    <span className="mr-3 text-sm">{getStatusIcon(entry.status)}</span>
                    <span
                      className="text-sm truncate flex-1"
                      onClick={() => onFileOpen?.(entry.path)}
                    >
                      {entry.path}
                    </span>
                    <button
                      onClick={() => handleDiffView(entry)}
                      className="ml-2 p-1 rounded hover:bg-surface transition-colors text-muted hover:text-accent-500"
                      title="View diff"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    </button>
                    <span className={`text-xs ml-2 ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'staged' && (
          <div className="p-3">
            <div className="mb-3">
              <button
                onClick={unstageFiles}
                disabled={selectedStagedFiles.size === 0}
                className="w-full px-3 py-2 bg-surface-secondary hover:bg-surface text-ink-700 text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Unstage {selectedStagedFiles.size} file{selectedStagedFiles.size !== 1 ? 's' : ''}
              </button>
            </div>

            <div className="space-y-1">
              {staged.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <p className="text-sm">No staged files</p>
                </div>
              ) : (
                staged.map((entry) => (
                  <div
                    key={entry.path}
                    className={`flex items-center p-2 rounded hover:bg-surface-secondary ${
                      selectedStagedFiles.has(entry.path) ? 'bg-accent-500/10 border border-accent-500/20' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStagedFiles.has(entry.path)}
                      onChange={() => handleFileToggle(entry.path, true)}
                      className="mr-3"
                    />
                    <span className="mr-3 text-sm">{getStatusIcon(entry.status)}</span>
                    <span className="text-sm truncate flex-1">{entry.path}</span>
                    <span className={`text-xs ml-2 ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {staged.length > 0 && (
              <div className="mt-4 p-3 bg-surface-secondary rounded-lg">
                <h4 className="text-sm font-medium mb-2">Commit Changes</h4>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Enter commit message..."
                  className="w-full px-3 py-2 text-sm border border-ink-900/10 rounded resize-none focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                  rows={3}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted">
                    {staged.length} file{staged.length !== 1 ? 's' : ''} staged
                  </span>
                  <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim()}
                    className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Commit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <div className="p-3">
            <div className="space-y-3">
              {commits.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <p className="text-sm">No commits yet</p>
                </div>
              ) : (
                commits.map((commit) => (
                  <div key={commit.id} className="border border-ink-900/5 rounded p-3 hover:bg-surface-secondary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-900 mb-1">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span>{commit.author}</span>
                          <span>•</span>
                          <span>{new Date(commit.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <code className="text-xs text-muted font-mono">
                        {commit.id.substring(0, 7)}
                      </code>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="p-3">
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="New branch name..."
                  className="flex-1 px-3 py-2 text-sm border border-ink-900/10 rounded focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
                <button
                  onClick={createBranch}
                  disabled={!newBranchName.trim()}
                  className="px-3 py-2 bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  onClick={() => switchBranch(branch.name)}
                  className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                    branch.current
                      ? 'bg-accent-500/10 border border-accent-500/20'
                      : 'hover:bg-surface-secondary'
                  }`}
                >
                  <span className="mr-2 text-sm">
                    {branch.current ? '●' : '○'}
                  </span>
                  <span className="text-sm truncate flex-1">{branch.name}</span>
                  {branch.current && (
                    <span className="text-xs text-accent-600 ml-2">current</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'diff' && selectedFileForDiff && diffContent && (
          <div className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">{selectedFileForDiff.path}</span>
              <button
                onClick={() => {
                  setSelectedFileForDiff(null);
                  setDiffContent(null);
                }}
                className="p-1 rounded hover:bg-surface-secondary transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <DiffViewer
              oldContent={diffContent.old}
              newContent={diffContent.new}
              filename={selectedFileForDiff.path}
            />
          </div>
        )}

        {activeTab === 'diff' && !selectedFileForDiff && (
          <div className="p-8 text-center text-muted">
            <p className="text-sm">Select a file to view diff</p>
          </div>
        )}
      </div>
    </div>
  );
}