import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "../components/CodeBlock";

export default function MDContent({ text }: { text: string }) {
  // Ensure text is always a properly formatted string
  const safeText = (() => {
    if (text == null) return "";
    if (typeof text === "string") return text;
    // If text has a .text property (common in SDK responses), use it
    if (typeof text === "object" && text !== null && "text" in text && typeof (text as { text: unknown }).text === "string") {
      return (text as { text: string }).text;
    }
    // For objects/arrays, format as readable JSON
    if (typeof text === "object") {
      try {
        return JSON.stringify(text, null, 2);
      } catch (error) {
        // Fallback if JSON.stringify fails
        return String(text);
      }
    }
    // For other types (numbers, booleans, etc.), convert to string
    return String(text);
  })();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        h1: (props) => <h1 className="mt-6 text-2xl font-semibold text-ink-900 dark:text-ink-100" {...props} />,
        h2: (props) => <h2 className="mt-5 text-xl font-semibold text-ink-900 dark:text-ink-100" {...props} />,
        h3: (props) => <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-100" {...props} />,
        h4: (props) => <h4 className="mt-3 text-base font-semibold text-ink-800 dark:text-ink-200" {...props} />,
        p: (props) => <p className="mt-3 text-[15px] leading-relaxed text-ink-800 dark:text-ink-100" {...props} />,
        ul: (props) => <ul className="mt-3 ml-5 list-disc space-y-1.5" {...props} />,
        ol: (props) => <ol className="mt-3 ml-5 list-decimal space-y-1.5" {...props} />,
        li: (props) => <li className="text-[15px] text-ink-800 dark:text-ink-100 pl-1" {...props} />,
        strong: (props) => <strong className="text-ink-900 dark:text-ink-100 font-semibold" {...props} />,
        em: (props) => <em className="text-ink-800 dark:text-ink-200" {...props} />,
        a: (props) => (
          <a
            className="text-accent-500 hover:text-accent-600 underline underline-offset-2 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        blockquote: (props) => (
          <blockquote
            className="mt-4 border-l-4 border-accent-500/50 pl-4 py-1 text-ink-600 dark:text-ink-400 italic"
            {...props}
          />
        ),
        table: (props) => (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-900/10" {...props} />
          </div>
        ),
        th: (props) => <th className="px-4 py-2 text-left text-sm font-semibold text-ink-900 dark:text-ink-100 bg-surface-tertiary" {...props} />,
        td: (props) => <td className="px-4 py-2 text-sm text-ink-800 dark:text-ink-100 border-t border-ink-900/10" {...props} />,
        hr: (props) => <hr className="my-6 border-ink-900/10" {...props} />,
        pre: (props) => {
          const { children, className } = props;
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : "plaintext";

          // Properly extract text content from children
          const codeContent = (() => {
            if (typeof children === "string") return children;
            if (Array.isArray(children)) {
              return children
                .map(child => {
                  if (typeof child === "string") return child;
                  if (React.isValidElement(child) && (child.props as { children?: React.ReactNode }).children) {
                    return String((child.props as { children: React.ReactNode }).children);
                  }
                  return String(child);
                })
                .join("");
            }
            if (React.isValidElement(children) && (children.props as { children?: React.ReactNode }).children) {
              return String((children.props as { children: React.ReactNode }).children);
            }
            return String(children);
          })();

          return (
            <CodeBlock
              code={codeContent}
              language={language}
              showLineNumbers={codeContent.split("\n").length > 3}
            />
          );
        },
        code: (props) => {
          const { children, className, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !String(children).includes("\n");

          if (isInline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-surface-tertiary text-accent-700 dark:text-accent-300 text-[14px] font-mono"
                {...rest}
              >
                {children}
              </code>
            );
          }

          return null;
        }
      }}
    >
      {safeText}
    </ReactMarkdown>
  );
}
