import { useEffect, useRef, useState } from "react";
import type { SDKMessage, PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import type { StreamMessage } from "../types";
import MDContent from "../render/markdown";
import { DecisionPanel } from "./DecisionPanel";
import { useAppStore } from "../store/useAppStore";


// Helper function to safely convert any value to a string representation
function safeStringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }
  return String(value);
}

// Type definitions based on SDK message structure
type MessageContent = any;
type ToolResultContent = any;
type ToolStatus = "pending" | "running" | "success" | "error";
type PermissionRequest = { toolUseId: string; toolName: string; input: unknown };
const toolStatusMap = new Map<string, ToolStatus>();
const toolStatusListeners = new Set<() => void>();
const MAX_VISIBLE_LINES = 5;

type AskUserQuestionInput = {
  questions?: Array<{
    question: string;
    header?: string;
    options?: Array<{ label: string; description?: string }>;
    multiSelect?: boolean;
  }>;
};

const getAskUserQuestionSignature = (input?: AskUserQuestionInput | null) => {
  if (!input?.questions?.length) return "";
  return input.questions.map((question) => {
    const options = (question.options ?? []).map((o) => `${o.label}|${o.description ?? ""}`).join(",");
    return `${question.question}|${question.header ?? ""}|${question.multiSelect ? "1" : "0"}|${options}`;
  }).join("||");
};

const setToolStatus = (toolUseId: string | undefined, status: ToolStatus) => {
  if (!toolUseId) return;
  toolStatusMap.set(toolUseId, status);
  toolStatusListeners.forEach((listener) => listener());
};

const useToolStatus = (toolUseId: string | undefined) => {
  const [status, setStatus] = useState<ToolStatus | undefined>(() =>
    toolUseId ? toolStatusMap.get(toolUseId) : undefined
  );
  useEffect(() => {
    if (!toolUseId) return;
    const handleUpdate = () => setStatus(toolStatusMap.get(toolUseId));
    toolStatusListeners.add(handleUpdate);
    return () => { toolStatusListeners.delete(handleUpdate); };
  }, [toolUseId]);
  return status;
};

// Tool icons mapping
const TOOL_ICONS: Record<string, React.ReactElement> = {
  Bash: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  Read: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Write: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Edit: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Glob: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Grep: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Task: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  WebFetch: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  LS: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  default: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

const StatusBadge = ({ status }: { status: ToolStatus }) => {
  const config = {
    pending: { color: "bg-muted", label: "Pending", icon: null },
    running: { color: "bg-info", label: "Running", icon: "animate-spin" },
    success: { color: "bg-success", label: "Success", icon: null },
    error: { color: "bg-error", label: "Error", icon: null },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status === "running" ? "bg-info-light text-info-foreground" : ""}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.color} ${config.icon || ""}`} />
      {config.label}
    </span>
  );
};

const StatusDot = ({ variant = "accent", isActive = false, isVisible = true }: {
  variant?: "accent" | "success" | "error" | "info"; isActive?: boolean; isVisible?: boolean;
}) => {
  if (!isVisible) return null;
  const colorClass = {
    success: "bg-success",
    error: "bg-error",
    info: "bg-info",
    accent: "bg-accent-500",
  }[variant] || "bg-accent-500";

  return (
    <span className="relative flex h-2 w-2">
      {isActive && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colorClass} opacity-75`} />}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${colorClass}`} />
    </span>
  );
};



function isMarkdown(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const patterns: RegExp[] = [/^#{1,6}\s+/m, /```[\s\S]*?```/];
  return patterns.some((pattern) => pattern.test(text));
}

function extractTagContent(input: string, tag: string): string | null {
  const match = input.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1] : null;
}

const ToolResult = ({ messageContent }: { messageContent: ToolResultContent }) => {
  // Hooks must be called before any early returns
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);

  if (messageContent.type !== "tool_result") return null;

  const toolUseId = messageContent.tool_use_id;
  const status: ToolStatus = messageContent.is_error ? "error" : "success";
  const isError = messageContent.is_error;
  let lines: string[] = [];

  if (messageContent.is_error) {
    const contentText = typeof messageContent.content === 'string'
      ? messageContent.content
      : (messageContent.content as any)?.text || safeStringify(messageContent.content);
    lines = [extractTagContent(contentText, "tool_use_error") || contentText];
  } else {
    try {
      if (Array.isArray(messageContent.content)) {
        lines = messageContent.content.map((item: any) => {
          if (typeof item === 'string') return item;
          return (item as any)?.text || safeStringify(item);
        }).join("\n").split("\n");
      } else if (typeof messageContent.content === 'string') {
        lines = messageContent.content.split("\n");
      } else {
        // Try to extract text from object, fallback to JSON representation
        const contentText = (messageContent.content as any)?.text || safeStringify(messageContent.content);
        lines = contentText.split("\n");
      }
    } catch { lines = [safeStringify(messageContent)]; }
  }

  const contentText = lines.join("\n");
  const isMarkdownContent = isMarkdown(contentText);
  const hasMoreLines = lines.length > MAX_VISIBLE_LINES;
  const visibleContent = hasMoreLines && !isExpanded ? lines.slice(0, MAX_VISIBLE_LINES).join("\n") : contentText;

  useEffect(() => { setToolStatus(toolUseId, status); }, [toolUseId, status]);
  useEffect(() => {
    if (!hasMoreLines || isFirstRender.current) { isFirstRender.current = false; return; }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hasMoreLines, isExpanded]);

  return (
    <div className="flex flex-col mt-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">Output</span>
        <StatusBadge status={status} />
      </div>
      <div className={`rounded-lg overflow-hidden border transition-all duration-300 ${isError
        ? "bg-error-light border-error/20"
        : "bg-surface-secondary border-ink-900/5 shadow-sm"
        }`}>
        <div className="p-4">
          <pre className={`text-[13px] leading-relaxed whitespace-pre-wrap break-words font-mono ${isError ? "text-error" : "text-ink-700"
            }`}>
            {isMarkdownContent ? <MDContent text={visibleContent} /> : String(visibleContent || "")}
          </pre>
        </div>
        {hasMoreLines && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2 text-xs font-medium text-accent-500 hover:text-accent-600 bg-ink-900/5 hover:bg-ink-900/10 transition-colors flex items-center justify-center gap-2 border-t border-ink-900/5"
          >
            <span>{isExpanded ? "Show less" : `Show ${lines.length - MAX_VISIBLE_LINES} more lines`}</span>
            <svg className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

const AssistantBlockCard = ({ title, text, showIndicator = false, icon, variant = "default" }: { title: string; text: string; showIndicator?: boolean; icon?: React.ReactElement; variant?: "default" | "thinking" }) => {
  const aiProfile = useAppStore(s => s.aiProfile);

  return (
    <div className={`flex flex-col mt-8 ${variant === "thinking" ? "opacity-80" : ""}`}>
      <div className="flex items-center gap-3 mb-4">
        {icon || <StatusDot variant="success" isActive={showIndicator} isVisible={showIndicator} />}
        <span className="text-[13px] font-bold text-ink-600 uppercase tracking-widest">{aiProfile.name || title}</span>
      </div>
      <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-surface-secondary prose-pre:border prose-pre:border-ink-900/5 ${variant === "thinking" ? "italic text-ink-500" : "text-ink-800"}`}>
        <MDContent text={text} />
      </div>
    </div>
  );
};

const ToolUseCard = ({ messageContent }: { messageContent: MessageContent }) => {
  // Hooks must be called before any early returns
  const toolStatus = useToolStatus(messageContent.type === "tool_use" ? messageContent.id : undefined);
  const statusVariant: ToolStatus = toolStatus || "pending";

  if (messageContent.type !== "tool_use") return null;

  useEffect(() => {
    if (messageContent?.id && !toolStatusMap.has(messageContent.id)) setToolStatus(messageContent.id, "pending");
  }, [messageContent?.id]);

  const getToolInfo = (): { label: string; value: string } | null => {
    const input = messageContent.input as Record<string, any>;
    switch (messageContent.name) {
      case "Bash":
        return { label: "Command", value: input?.command || "No command" };
      case "Read":
        return { label: "File", value: input?.file_path || "Unknown file" };
      case "Write":
        return { label: "Write to", value: input?.file_path || "Unknown file" };
      case "Edit":
        return { label: "Edit file", value: input?.file_path || "Unknown file" };
      case "Glob":
        return { label: "Pattern", value: input?.pattern || "No pattern" };
      case "Grep":
        return { label: "Search", value: input?.query || input?.pattern || "No query" };
      case "Task":
        return { label: "Task", value: input?.description || "No description" };
      case "WebFetch":
        return { label: "URL", value: input?.url || "Unknown URL" };
      case "LS":
        return { label: "Directory", value: input?.path || input?.cwd || "Current dir" };
      default:
        return { label: "Input", value: JSON.stringify(input).slice(0, 50) + "..." };
    }
  };

  const toolInfo = getToolInfo();
  const ToolIcon = TOOL_ICONS[messageContent.name] || TOOL_ICONS.default;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-ink-900/5 bg-surface-secondary/30 p-4 mt-6 interactive-card border-l-4 border-l-accent-400">
      {/* Header with tool name and status */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${statusVariant === "error" ? "bg-error/10 text-error" :
            statusVariant === "success" ? "bg-success/10 text-success" :
              statusVariant === "running" ? "bg-info/10 text-info" :
                "bg-accent-500/10 text-accent-500"
            }`}>
            {ToolIcon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-ink-800 truncate">{messageContent.name}</span>
            {toolInfo && (
              <span className="text-xs text-muted truncate">{toolInfo.value}</span>
            )}
          </div>
        </div>
        <StatusBadge status={statusVariant} />
      </div>

      {/* Tool details for complex tools */}
      {messageContent.name === "Bash" && (messageContent.input as Record<string, any>)?.command && (
        <div className="mt-2 rounded-lg bg-surface px-3 py-2 overflow-x-auto">
          <code className="text-xs font-mono text-ink-600 whitespace-nowrap">
            {(messageContent.input as Record<string, any>).command}
          </code>
        </div>
      )}

      {messageContent.name === "Task" && (messageContent.input as Record<string, any>)?.description && (
        <div className="mt-2 rounded-lg bg-surface px-3 py-2">
          <p className="text-xs text-ink-600">
            {(messageContent.input as Record<string, any>).description}
          </p>
        </div>
      )}
    </div>
  );
};

const AskUserQuestionCard = ({
  messageContent,
  permissionRequest,
  onPermissionResult
}: {
  messageContent: MessageContent;
  permissionRequest?: PermissionRequest;
  onPermissionResult?: (toolUseId: string, result: PermissionResult) => void;
}) => {
  if (messageContent.type !== "tool_use") return null;

  const input = messageContent.input as AskUserQuestionInput | null;
  const questions = input?.questions ?? [];
  const currentSignature = getAskUserQuestionSignature(input);
  const requestSignature = getAskUserQuestionSignature(permissionRequest?.input as AskUserQuestionInput | undefined);
  const isActiveRequest = permissionRequest && currentSignature === requestSignature;

  if (isActiveRequest && onPermissionResult) {
    return (
      <div className="mt-4 animate-fade-in">
        <DecisionPanel
          request={permissionRequest}
          onSubmit={(result) => onPermissionResult(permissionRequest.toolUseId, result)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-surface-tertiary/50 p-4 mt-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-accent-500/10 text-accent-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <span className="text-sm font-medium text-ink-800">Question</span>
      </div>
      {questions.map((q, idx) => (
        <div key={idx} className="pl-9 text-sm text-ink-600">
          <p className="font-medium text-ink-700">{q.question}</p>
          {q.header && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-surface text-muted">
              {q.header}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};



const UserMessageCard = ({ message }: { message: { type: "user_prompt"; prompt: string } }) => {
  const userProfile = useAppStore(s => s.userProfile);

  return (
    <div className="flex flex-col items-end mt-10 mb-4">
      <div className="max-w-[85%] bg-accent-100 dark:bg-accent-500/30 rounded-2xl rounded-tr-none px-5 py-3 border border-accent-500/20 shadow-sm">
        <div className="prose prose-sm max-w-none text-ink-900 prose-p:m-0">
          <MDContent text={message.prompt} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 px-1">
        <span className="text-[10px] font-bold text-accent-600 uppercase tracking-tighter">{userProfile.name}</span>
      </div>
    </div>
  );
};

export function MessageCard({
  message,
  isLast = false,
  isRunning = false,
  permissionRequest,
  onPermissionResult
}: {
  message: StreamMessage;
  isLast?: boolean;
  isRunning?: boolean;
  permissionRequest?: PermissionRequest;
  onPermissionResult?: (toolUseId: string, result: PermissionResult) => void;
}) {
  const showIndicator = isLast && isRunning;

  if (message.type === "user_prompt") {
    return <UserMessageCard message={message} />;
  }

  const sdkMessage = message as SDKMessage;

  if (sdkMessage.type === "system") {
    return null; // Hide system messages
  }

  if (sdkMessage.type === "result") {
    if (sdkMessage.subtype === "success") {
      return null; // Hide session result messages
    }
    return (
      <div className="flex flex-col gap-3 mt-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-error/10 text-error">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-error">Session Error</span>
        </div>
        <div className="rounded-xl bg-error-light border border-error/20 p-4 overflow-x-auto">
          <pre className="text-sm text-error font-mono whitespace-pre-wrap">{JSON.stringify(sdkMessage, null, 2)}</pre>
        </div>
      </div>
    );
  }

  if (sdkMessage.type === "assistant") {
    const contents = sdkMessage.message.content;
    return (
      <>
        {contents.map((content: MessageContent, idx: number) => {
          const isLastContent = idx === contents.length - 1;
          if (content.type === "thinking") {
            return (
              <AssistantBlockCard
                key={idx}
                title="Thinking"
                text={content.thinking}
                showIndicator={isLastContent && showIndicator}
                variant="thinking"
                icon={
                  <div className="p-1 rounded-lg text-muted">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                }
              />
            );
          }
          if (content.type === "text") {
            return (
              <AssistantBlockCard
                key={idx}
                title="Claude"
                text={content.text}
                showIndicator={isLastContent && showIndicator}
                icon={
                  <div className="p-1 rounded-lg bg-accent-500/10 text-accent-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                  </div>
                }
              />
            );
          }
          if (content.type === "tool_use") {
            if (content.name === "AskUserQuestion") {
              return <AskUserQuestionCard key={idx} messageContent={content} permissionRequest={permissionRequest} onPermissionResult={onPermissionResult} />;
            }
            return <ToolUseCard key={idx} messageContent={content} />;
          }
          return null;
        })}
      </>
    );
  }

  if (sdkMessage.type === "user") {
    const contents = sdkMessage.message.content;
    return (
      <>
        {contents.map((content: ToolResultContent, idx: number) => {
          if (content.type === "tool_result") {
            return <ToolResult key={idx} messageContent={content} />;
          }
          return null;
        })}
      </>
    );
  }

  return null;
}

export { MessageCard as EventCard };
