import { useState, useRef, useCallback, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: 'left' | 'right';
  className?: string;
  onResize?: (width: number) => void;
}

export function ResizablePanel({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  side = 'left',
  className = '',
  onResize
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();
    let newWidth: number;

    if (side === 'left') {
      newWidth = e.clientX - panelRect.left;
    } else {
      newWidth = panelRect.right - e.clientX;
    }

    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(newWidth);
    onResize?.(newWidth);
  }, [isResizing, side, minWidth, maxWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className={`relative ${className}`}
      style={{ width: `${width}px` }}
    >
      {/* Panel content */}
      <div className="h-full overflow-hidden">
        {children}
      </div>

      {/* Resize handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 bg-transparent hover:bg-accent-500/20 cursor-col-resize transition-colors group ${
          side === 'left' ? 'right-0' : 'left-0'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-0.5 h-full bg-ink-900/40 rounded-full mx-auto"></div>
          <div className="w-0.5 h-full bg-ink-900/40 rounded-full mx-auto -ml-1"></div>
        </div>
      </div>
    </div>
  );
}

interface ResizableLayoutProps {
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  centerContent: React.ReactNode;
  leftPanelDefaultWidth?: number;
  rightPanelDefaultWidth?: number;
  leftPanelMinWidth?: number;
  rightPanelMinWidth?: number;
  leftPanelMaxWidth?: number;
  rightPanelMaxWidth?: number;
  className?: string;
}

export function ResizableLayout({
  leftPanel,
  rightPanel,
  centerContent,
  leftPanelDefaultWidth = 300,
  rightPanelDefaultWidth = 300,
  leftPanelMinWidth = 200,
  rightPanelMinWidth = 200,
  leftPanelMaxWidth = 600,
  rightPanelMaxWidth = 600,
  className = ''
}: ResizableLayoutProps) {
  return (
    <div className={`flex h-full ${className}`}>
      {/* Left panel */}
      {leftPanel && (
        <ResizablePanel
          defaultWidth={leftPanelDefaultWidth}
          minWidth={leftPanelMinWidth}
          maxWidth={leftPanelMaxWidth}
          side="left"
          className="border-r border-ink-900/10 bg-surface-secondary/50"
        >
          {leftPanel}
        </ResizablePanel>
      )}

      {/* Center content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {centerContent}
      </div>

      {/* Right panel */}
      {rightPanel && (
        <ResizablePanel
          defaultWidth={rightPanelDefaultWidth}
          minWidth={rightPanelMinWidth}
          maxWidth={rightPanelMaxWidth}
          side="right"
          className="border-l border-ink-900/10 bg-surface-secondary/50"
        >
          {rightPanel}
        </ResizablePanel>
      )}
    </div>
  );
}