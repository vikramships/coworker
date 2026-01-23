export type CommandCategory = 'File' | 'Edit' | 'View' | 'Search' | 'Terminal' | 'Git' | 'Debug' | 'General';

export interface Command {
  id: string;
  label: string;
  description: string;
  category: CommandCategory;
  shortcut: string;
  action: () => void;
}

export const builtinCommands: Command[] = [
  { id: 'file.new', label: 'New File', description: 'Create a new file', category: 'File', shortcut: 'Ctrl+N', action: () => {} },
  { id: 'file.open', label: 'Open File', description: 'Open an existing file', category: 'File', shortcut: 'Ctrl+O', action: () => {} },
  { id: 'file.save', label: 'Save File', description: 'Save the current file', category: 'File', shortcut: 'Ctrl+S', action: () => {} },
  { id: 'file.saveAll', label: 'Save All', description: 'Save all modified files', category: 'File', shortcut: 'Ctrl+K S', action: () => {} },
  { id: 'edit.undo', label: 'Undo', description: 'Undo last action', category: 'Edit', shortcut: 'Ctrl+Z', action: () => {} },
  { id: 'edit.redo', label: 'Redo', description: 'Redo last action', category: 'Edit', shortcut: 'Ctrl+Shift+Z', action: () => {} },
  { id: 'edit.find', label: 'Find', description: 'Find text in current file', category: 'Edit', shortcut: 'Ctrl+F', action: () => {} },
  { id: 'edit.replace', label: 'Replace', description: 'Find and replace text', category: 'Edit', shortcut: 'Ctrl+H', action: () => {} },
  { id: 'view.terminal', label: 'Toggle Terminal', description: 'Show or hide the terminal panel', category: 'View', shortcut: 'Ctrl+`', action: () => {} },
  { id: 'view.git', label: 'Toggle Git', description: 'Show or hide the git panel', category: 'View', shortcut: 'Ctrl+Shift+G', action: () => {} },
  { id: 'view.sidebar', label: 'Toggle Sidebar', description: 'Show or hide the file explorer sidebar', category: 'View', shortcut: 'Ctrl+B', action: () => {} },
  { id: 'search.inFiles', label: 'Search in Files', description: 'Search for files by name', category: 'Search', shortcut: 'Ctrl+Shift+F', action: () => {} },
  { id: 'search.inContent', label: 'Search in Content', description: 'Search for text across files', category: 'Search', shortcut: 'Ctrl+Shift+H', action: () => {} },
  { id: 'terminal.new', label: 'New Terminal', description: 'Create a new terminal tab', category: 'Terminal', shortcut: 'Ctrl+Shift+T', action: () => {} },
  { id: 'git.commit', label: 'Commit', description: 'Commit staged changes', category: 'Git', shortcut: '', action: () => {} },
  { id: 'git.push', label: 'Push', description: 'Push changes to remote', category: 'Git', shortcut: '', action: () => {} },
  { id: 'git.pull', label: 'Pull', description: 'Pull changes from remote', category: 'Git', shortcut: '', action: () => {} },
  { id: 'debug.start', label: 'Start Debug', description: 'Start debugging', category: 'Debug', shortcut: 'F5', action: () => {} },
  { id: 'debug.stop', label: 'Stop Debug', description: 'Stop debugging', category: 'Debug', shortcut: 'Shift+F5', action: () => {} },
  { id: 'format.code', label: 'Format Code', description: 'Format the current file', category: 'Edit', shortcut: 'Shift+Alt+F', action: () => {} },
  { id: 'settings.open', label: 'Open Settings', description: 'Open application settings', category: 'General', shortcut: 'Ctrl+,', action: () => {} },
];

export function searchCommands(query: string): Command[] {
  const q = query.toLowerCase();
  return builtinCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(q) ||
    cmd.description.toLowerCase().includes(q) ||
    cmd.category.toLowerCase().includes(q)
  );
}

export function getCommandsByCategory(category: CommandCategory): Command[] {
  return builtinCommands.filter(cmd => cmd.category === category);
}

export function getCommand(id: string): Command | undefined {
  return builtinCommands.find(cmd => cmd.id === id);
}