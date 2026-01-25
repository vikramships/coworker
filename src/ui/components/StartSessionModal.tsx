import { useEffect, useState } from "react";

interface StartSessionModalProps {
  cwd: string;
  prompt: string;
  pendingStart: boolean;
  onCwdChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onStart: () => void;
  onClose: () => void;
}

export function StartSessionModal({
  cwd,
  prompt,
  pendingStart,
  onCwdChange,
  onPromptChange,
  onStart,
  onClose,
}: StartSessionModalProps) {
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [recentCwds, setRecentCwds] = useState<string[]>([]);

  // Sync with external prompt changes
  useEffect(() => {
    setLocalPrompt(prompt);
  }, [prompt]);

  // Load recent directories
  useEffect(() => {
    window.electron.getRecentCwds()
      .then(setRecentCwds)
      .catch(() => setRecentCwds([]));
  }, []);

  const handleDirectorySelect = async () => {
    const result = await window.electron.selectDirectory();
    if (result) {
      onCwdChange(result);
    }
  };

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
    onPromptChange(value);
  };

  const isValid = cwd.trim() && localPrompt.trim();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-ink-900/10 bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-ink-800">Start New Session</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted hover:bg-surface-tertiary hover:text-ink-700 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-muted mb-6">Create a new session to start working with Coworker.</p>

        {/* Working Directory */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-muted mb-2">Working Directory</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cwd}
              onChange={(e) => onCwdChange(e.target.value)}
              placeholder="/path/to/project"
              className="flex-1 px-4 py-2.5 text-sm bg-surface-secondary border border-ink-900/10 rounded-xl text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={handleDirectorySelect}
              className="px-4 py-2.5 text-sm bg-surface border border-ink-900/10 rounded-xl text-ink-700 hover:bg-surface-tertiary transition-colors"
            >
              Browse
            </button>
          </div>

          {/* Recent directories */}
          {recentCwds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recentCwds.map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => onCwdChange(path)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    cwd === path
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "bg-surface text-muted border border-ink-900/10 hover:border-accent/30"
                  }`}
                >
                  {path.split("/").pop()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-muted mb-2">What do you want to accomplish?</label>
          <textarea
            value={localPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Describe your task..."
            rows={4}
            className="w-full px-4 py-3 text-sm bg-surface-secondary border border-ink-900/10 rounded-xl text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none"
          />
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={!isValid || pendingStart}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
            isValid && !pendingStart
              ? "bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20"
              : "bg-surface-tertiary text-muted cursor-not-allowed"
          }`}
        >
          {pendingStart ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Starting...
            </span>
          ) : (
            "Start Session"
          )}
        </button>
      </div>
    </div>
  );
}
