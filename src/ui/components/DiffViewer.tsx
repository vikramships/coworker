

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filename?: string;
  language?: string;
  className?: string;
}

function parseDiff(oldContent: string, newContent: string): DiffHunk[] {
  // If content is identical, return no hunks
  if (oldContent === newContent) {
    return [];
  }

  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  // Simple diff algorithm - in a real implementation, you'd use a proper diff library
  const hunks: DiffHunk[] = [];
  const maxLines = Math.max(oldLines.length, newLines.length);

  const currentHunk: DiffLine[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      // Context line
      if (currentHunk.length === 0) {
        // Start new hunk
        currentHunk.push({
          type: 'context',
          content: oldLine || '',
          oldLineNumber: oldLineNum,
          newLineNumber: newLineNum,
        });
      } else {
        currentHunk.push({
          type: 'context',
          content: oldLine || '',
          oldLineNumber: oldLineNum,
          newLineNumber: newLineNum,
        });
      }
    } else {
      // Different lines
      if (oldLine !== undefined) {
        currentHunk.push({
          type: 'remove',
          content: oldLine,
          oldLineNumber: oldLineNum,
        });
      }
      if (newLine !== undefined) {
        currentHunk.push({
          type: 'add',
          content: newLine,
          newLineNumber: newLineNum,
        });
      }
    }

    if (oldLine !== undefined) oldLineNum++;
    if (newLine !== undefined) newLineNum++;
  }

  if (currentHunk.length > 0) {
    hunks.push({
      header: '@@ -1 +' + newLines.length + ' @@',
      lines: currentHunk,
    });
  }

  return hunks;
}

function DiffLineComponent({ line }: { line: DiffLine }) {
  const getLineClass = () => {
    switch (line.type) {
      case 'add':
        return 'bg-green-500/10 border-l-2 border-green-500';
      case 'remove':
        return 'bg-red-500/10 border-l-2 border-red-500';
      case 'context':
        return 'bg-surface-secondary/50';
      case 'header':
        return 'bg-accent-500/10 border-l-2 border-accent-500 font-medium';
      default:
        return '';
    }
  };

  const getPrefix = () => {
    switch (line.type) {
      case 'add':
        return '+';
      case 'remove':
        return '-';
      case 'context':
        return ' ';
      case 'header':
        return '@';
      default:
        return ' ';
    }
  };

  return (
    <div className={`flex items-center py-1 px-2 text-sm font-mono ${getLineClass()}`}>
      {/* Old line number */}
      <span className="w-12 text-right text-muted text-xs mr-2 select-none">
        {line.oldLineNumber || ''}
      </span>

      {/* New line number */}
      <span className="w-12 text-right text-muted text-xs mr-2 select-none">
        {line.newLineNumber || ''}
      </span>

      {/* Change indicator */}
      <span className={`w-4 text-center mr-2 select-none ${
        line.type === 'add' ? 'text-green-600' :
        line.type === 'remove' ? 'text-red-600' :
        line.type === 'header' ? 'text-accent-600' :
        'text-muted'
      }`}>
        {getPrefix()}
      </span>

      {/* Content */}
      <span className="flex-1 whitespace-pre-wrap break-words">
        {line.content}
      </span>
    </div>
  );
}

export function DiffViewer({
  oldContent,
  newContent,
  filename,
  language,
  className = ''
}: DiffViewerProps) {
  const hunks = parseDiff(oldContent, newContent);

  return (
    <div className={`border border-ink-900/10 rounded-lg bg-surface ${className}`}>
      {/* Header */}
      {filename && (
        <div className="flex items-center justify-between p-3 border-b border-ink-900/5 bg-surface-secondary/50">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            <span className="text-sm font-medium">{filename}</span>
            {language && (
              <span className="text-xs text-muted bg-surface px-2 py-1 rounded">
                {language}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{hunks.reduce((acc, hunk) => acc + hunk.lines.filter(l => l.type === 'add').length, 0)} additions</span>
            <span>{hunks.reduce((acc, hunk) => acc + hunk.lines.filter(l => l.type === 'remove').length, 0)} deletions</span>
          </div>
        </div>
      )}

      {/* Diff content */}
      <div className="max-h-96 overflow-y-auto">
        {hunks.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <svg className="h-12 w-12 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No changes to display</p>
          </div>
        ) : (
          hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex}>
              {/* Hunk header */}
              <div className="bg-accent-500/5 border-y border-ink-900/5 px-2 py-1">
                <span className="text-xs font-mono text-accent-700">{hunk.header}</span>
              </div>

              {/* Hunk lines */}
              {hunk.lines.map((line, lineIndex) => (
                <DiffLineComponent key={lineIndex} line={line} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}