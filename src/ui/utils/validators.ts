export function validateFilePath(path: string): { valid: boolean; error?: string } {
  if (!path || path.trim() === '') {
    return { valid: false, error: 'Path cannot be empty' };
  }
  
  if (path.includes('..')) {
    return { valid: false, error: 'Path cannot contain parent directory references (..)' };
  }
  
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateJson(json: string): { valid: boolean; error?: string; parsed?: unknown } {
  try {
    const parsed = JSON.parse(json);
    return { valid: true, parsed };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON: ' + String(error) };
  }
}

export function validateCommitMessage(message: string): { valid: boolean; error?: string } {
  if (!message || message.trim().length < 10) {
    return { valid: false, error: 'Commit message must be at least 10 characters' };
  }
  
  if (message.trim().length > 2000) {
    return { valid: false, error: 'Commit message must be less than 2000 characters' };
  }
  
  const firstLine = message.split('\n')[0].trim();
  if (firstLine.length > 72) {
    return { valid: false, error: 'First line of commit message should be 72 characters or less' };
  }
  
  return { valid: true };
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/^\./, '')
    .replace(/\.$/, '')
    .trim();
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}