import { useState, useCallback } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  filename?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  js: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  tsx: "TSX",
  py: "Python",
  rb: "Ruby",
  rs: "Rust",
  go: "Go",
  java: "Java",
  c: "C",
  cpp: "C++",
  cs: "C#",
  php: "PHP",
  swift: "Swift",
  kt: "Kotlin",
  scala: "Scala",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  yaml: "YAML",
  md: "Markdown",
  sh: "Shell",
  bash: "Bash",
  zsh: "Zsh",
  sql: "SQL",
  dockerfile: "Dockerfile",
  xml: "XML",
  lua: "Lua",
  r: "R",
  vim: "Vim",
  toml: "TOML",
  ini: "INI",
  conf: "Config",
  makefile: "Makefile",
  cmake: "CMake",
  gradle: "Gradle",
  plaintext: "Plain Text",
};

function getLanguageName(lang: string | undefined): string {
  if (!lang) return "Code";
  return LANGUAGE_NAMES[lang.toLowerCase()] || lang.toUpperCase();
}

function formatFilename(filename: string | undefined): string | null {
  if (!filename) return null;
  return filename.split("/").pop() || filename;
}

export function CodeBlock({
  code,
  language = "plaintext",
  showLineNumbers = false,
  filename,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [code]);

  const lines = code.split("\n");
  const maxLineNumberWidth = String(lines.length).length;

  return (
    <div className="rounded-xl overflow-hidden border border-ink-900/10 bg-surface-tertiary dark:bg-[#0D1117] my-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-secondary dark:bg-[#161B22] border-b border-ink-900/10">
        <div className="flex items-center gap-3">
          {/* Language badge */}
          <span className="px-2 py-0.5 rounded-md bg-accent-500/20 text-ink-700 dark:text-accent-400 text-xs font-medium">
            {getLanguageName(language)}
          </span>
          {/* Filename if provided */}
          {filename && (
            <span className="text-xs text-ink-400 font-mono">
              {formatFilename(filename)}
            </span>
          )}
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-400 hover:text-ink-200 hover:bg-ink-900/30 transition-all"
            title="Copy code"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-success" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
          {/* Open in editor button (future feature) */}
          {filename && (
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-400 hover:text-ink-200 hover:bg-ink-900/30 transition-all"
              title="Open in editor"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15,3 21,3 21,9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* Code content */}
      <div className="overflow-x-auto">
        <div className="relative">
          {/* Line numbers */}
          {showLineNumbers && (
            <div className="absolute left-0 top-0 bottom-0 px-3 py-3 bg-surface-tertiary dark:bg-[#0D1117] border-r border-ink-900/10 select-none text-right">
              <table className="h-full">
                <tbody>
                  {lines.map((_, index) => (
                    <tr key={index} className="h-6">
                      <td
                        className="w-8 text-xs font-mono text-ink-600 tabular-nums"
                        style={{ minWidth: `${maxLineNumberWidth * 8}px` }}
                      >
                        {index + 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Code */}
          <pre
            className={`p-3 ${showLineNumbers ? "pl-12" : ""} m-0 text-sm font-mono leading-6`}
            style={{ background: "transparent" }}
          >
            <code className="text-ink-800 dark:text-[#E6EDF3]">{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

// Simplified inline code component
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-surface-tertiary text-accent-700 dark:text-accent-300 text-sm font-mono">
      {children}
    </code>
  );
}
