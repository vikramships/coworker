export async function readFile(path: string): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const result = await window.electron.readFile(path);
    return result;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function writeFile(path: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await window.electron.writeFile(path, content);
    return result;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function listFiles(path: string): Promise<{ success: boolean; items?: Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }>; error?: string }> {
  try {
    const result = await window.electron.listFiles(path);
    return result;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getFileStats(path: string): Promise<{ success: boolean; stats?: { size: number; isDirectory: boolean; isFile: boolean; mtime: number }; error?: string }> {
  try {
    const result = await window.electron.getFileStats(path);
    return result;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function getFileExtension(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  return ext || '';
}

export function getFileLanguage(path: string): string {
  const ext = getFileExtension(path);
  const languages: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    css: 'css',
    scss: 'css',
    html: 'xml',
    xml: 'xml',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    txt: 'plaintext',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    sql: 'plaintext',
  };
  return languages[ext] || 'plaintext';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function getLineCount(text: string): number {
  return text.split('\n').length;
}

export function getColumnAtPosition(text: string, position: number): number {
  const lines = text.substring(0, position).split('\n');
  const lastLine = lines[lines.length - 1] || '';
  return lastLine.length + 1;
}

export function getPositionFromLine(text: string, line: number, col: number): number {
  const lines = text.split('\n');
  let pos = 0;
  for (let i = 0; i < line - 1; i++) {
    pos += lines[i].length + 1;
  }
  return pos + col - 1;
}