import type { SDKMessage, PermissionResult } from "@anthropic-ai/claude-agent-sdk";

// Scout types
export type ScoutFileInfo = {
  path: string;
  size: number;
};

export type ScoutSearchResult = {
  path: string;
  line: number;
  content: string;
};

// FD types
export type FdFileInfo = {
  path: string;
  size?: number;
};

export type FdOptions = {
  hidden?: boolean;
  ext?: string;
  type?: "file" | "dir" | "symlink";
  limit?: number;
};

// RG types
export type RgMatch = {
  path: string;
  line: number;
  content: string;
};

export type RgOptions = {
  ext?: string;
  glob?: string;
  context?: number;
  caseSensitive?: boolean;
  limit?: number;
};

export type UserPromptMessage = {
  type: "user_prompt";
  prompt: string;
};

export type StreamMessage = SDKMessage | UserPromptMessage;

export type SessionStatus = "idle" | "running" | "completed" | "error";

export type SessionInfo = {
  id: string;
  title: string;
  status: SessionStatus;
  claudeSessionId?: string;
  cwd?: string;
  createdAt: number;
  updatedAt: number;
};

// Server -> Client events
export type ServerEvent =
  | { type: "stream.message"; payload: { sessionId: string; message: StreamMessage } }
  | { type: "stream.user_prompt"; payload: { sessionId: string; prompt: string } }
  | { type: "session.status"; payload: { sessionId: string; status: SessionStatus; title?: string; cwd?: string; error?: string } }
  | { type: "session.list"; payload: { sessions: SessionInfo[] } }
  | { type: "session.history"; payload: { sessionId: string; status: SessionStatus; messages: StreamMessage[] } }
  | { type: "session.deleted"; payload: { sessionId: string } }
  | { type: "permission.request"; payload: { sessionId: string; toolUseId: string; toolName: string; input: unknown } }
  | { type: "runner.error"; payload: { sessionId?: string; message: string } }
  // Scout events
  | { type: "scout.find.result"; payload: { files: ScoutFileInfo[] } }
  | { type: "scout.search.result"; payload: { results: ScoutSearchResult[] } }
  | { type: "scout.list.result"; payload: { files: ScoutFileInfo[] } }
  | { type: "scout.error"; payload: { message: string } }
  // FD events
  | { type: "fd.find.result"; payload: { files: FdFileInfo[] } }
  | { type: "fd.list.result"; payload: { files: FdFileInfo[] } }
  | { type: "fd.error"; payload: { message: string } }
  // RG events
  | { type: "rg.search.result"; payload: { results: RgMatch[] } }
  | { type: "rg.files.result"; payload: { files: string[] } }
  | { type: "rg.error"; payload: { message: string } };

// Client -> Server events
export type ClientEvent =
  | { type: "session.start"; payload: { title: string; prompt: string; cwd?: string; allowedTools?: string } }
  | { type: "session.continue"; payload: { sessionId: string; prompt: string } }
  | { type: "session.stop"; payload: { sessionId: string } }
  | { type: "session.delete"; payload: { sessionId: string } }
  | { type: "session.list" }
  | { type: "session.history"; payload: { sessionId: string } }
  | { type: "permission.response"; payload: { sessionId: string; toolUseId: string; result: PermissionResult } }
  // Scout events
  | { type: "scout.find"; payload: { root: string; pattern: string; limit?: number } }
  | { type: "scout.search"; payload: { root: string; query: string; ext?: string; limit?: number } }
  | { type: "scout.list"; payload: { root: string } }
  // FD events
  | { type: "fd.find"; payload: { root: string; pattern: string; options?: FdOptions } }
  | { type: "fd.list"; payload: { root: string; options?: FdOptions } }
  // RG events
  | { type: "rg.search"; payload: { root: string; query: string; options?: RgOptions } }
  | { type: "rg.files"; payload: { root: string; pattern?: string; options?: { ext?: string } } };
