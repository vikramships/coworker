import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import bash from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('bash', bash);

export function highlightCode(code: string, language: string): string {
  if (language === 'plaintext') {
    return escapeHtml(code);
  }
  
  try {
    const result = hljs.highlight(code, { language });
    return result.value;
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function formatCodeForDisplay(code: string, language: string): { html: string; className: string } {
  return {
    html: highlightCode(code, language),
    className: `language-${language}`
  };
}

export function getSupportedLanguages(): string[] {
  return ['javascript', 'typescript', 'python', 'rust', 'css', 'json', 'xml', 'markdown', 'bash', 'plaintext'];
}