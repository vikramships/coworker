import { BrowserWindow } from "electron";
import type { ClientEvent, ServerEvent } from "./types.js";
import { runClaude, type RunnerHandle } from "./libs/runner.js";
import { SessionStore } from "./libs/session-store.js";
import { fdFind, fdList } from "./libs/fd.js";
import { rgSearch, rgFiles } from "./libs/rg.js";
import { app } from "electron";
import { join } from "path";

const DB_PATH = join(app.getPath("userData"), "sessions.db");
// Delay SessionStore instantiation until app is ready to avoid native module loading issues
let sessions: SessionStore | null = null;
const runnerHandles = new Map<string, RunnerHandle>();

function getSessions(): SessionStore {
  if (!sessions) {
    sessions = new SessionStore(DB_PATH);
  }
  return sessions;
}

function broadcast(event: ServerEvent) {
  const payload = JSON.stringify(event);
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    win.webContents.send("server-event", payload);
  }
}

function emit(event: ServerEvent) {
  if (event.type === "session.status") {
    getSessions().updateSession(event.payload.sessionId, { status: event.payload.status });
  }
  if (event.type === "stream.message") {
    getSessions().recordMessage(event.payload.sessionId, event.payload.message);
  }
  if (event.type === "stream.user_prompt") {
    getSessions().recordMessage(event.payload.sessionId, {
      type: "user_prompt",
      prompt: event.payload.prompt
    });
  }
  broadcast(event);
}

export function handleClientEvent(event: ClientEvent) {
  if (event.type === "session.list") {
    emit({
      type: "session.list",
      payload: { sessions: getSessions().listSessions() }
    });
    return;
  }

  if (event.type === "session.history") {
    const history = getSessions().getSessionHistory(event.payload.sessionId);
    if (!history) {
      emit({
        type: "runner.error",
        payload: { message: "Unknown session" }
      });
      return;
    }
    emit({
      type: "session.history",
      payload: {
        sessionId: history.session.id,
        status: history.session.status,
        messages: history.messages
      }
    });
    return;
  }

  if (event.type === "session.start") {
    const session = getSessions().createSession({
      cwd: event.payload.cwd,
      title: event.payload.title,
      allowedTools: event.payload.allowedTools,
      prompt: event.payload.prompt
    });

    getSessions().updateSession(session.id, {
      status: "running",
      lastPrompt: event.payload.prompt
    });
    emit({
      type: "session.status",
      payload: { sessionId: session.id, status: "running", title: session.title, cwd: session.cwd }
    });

    emit({
      type: "stream.user_prompt",
      payload: { sessionId: session.id, prompt: event.payload.prompt }
    });

    runClaude({
      prompt: event.payload.prompt,
      session,
      resumeSessionId: session.claudeSessionId,
      onEvent: emit,
      onSessionUpdate: (updates) => {
        getSessions().updateSession(session.id, updates);
      }
    })
      .then((handle) => {
        runnerHandles.set(session.id, handle);
        getSessions().setAbortController(session.id, undefined);
      })
      .catch((error) => {
        getSessions().updateSession(session.id, { status: "error" });
        emit({
          type: "session.status",
          payload: {
            sessionId: session.id,
            status: "error",
            title: session.title,
            cwd: session.cwd,
            error: String(error)
          }
        });
      });

    return;
  }

  if (event.type === "session.continue") {
    const session = getSessions().getSession(event.payload.sessionId);
    if (!session) {
      emit({
        type: "runner.error",
        payload: { message: "Unknown session" }
      });
      return;
    }

    if (!session.claudeSessionId) {
      emit({
        type: "runner.error",
        payload: { sessionId: session.id, message: "Session has no resume id yet." }
      });
      return;
    }

    getSessions().updateSession(session.id, { status: "running", lastPrompt: event.payload.prompt });
    emit({
      type: "session.status",
      payload: { sessionId: session.id, status: "running", title: session.title, cwd: session.cwd }
    });

    emit({
      type: "stream.user_prompt",
      payload: { sessionId: session.id, prompt: event.payload.prompt }
    });

    runClaude({
      prompt: event.payload.prompt,
      session,
      resumeSessionId: session.claudeSessionId,
      onEvent: emit,
      onSessionUpdate: (updates) => {
        getSessions().updateSession(session.id, updates);
      }
    })
      .then((handle) => {
        runnerHandles.set(session.id, handle);
      })
      .catch((error) => {
        getSessions().updateSession(session.id, { status: "error" });
        emit({
          type: "session.status",
          payload: {
            sessionId: session.id,
            status: "error",
            title: session.title,
            cwd: session.cwd,
            error: String(error)
          }
        });
      });

    return;
  }

  if (event.type === "session.stop") {
    const session = getSessions().getSession(event.payload.sessionId);
    if (!session) return;

    const handle = runnerHandles.get(session.id);
    if (handle) {
      handle.abort();
      runnerHandles.delete(session.id);
    }

    getSessions().updateSession(session.id, { status: "idle" });
    emit({
      type: "session.status",
      payload: { sessionId: session.id, status: "idle", title: session.title, cwd: session.cwd }
    });
    return;
  }

  if (event.type === "session.delete") {
    const sessionId = event.payload.sessionId;
    const handle = runnerHandles.get(sessionId);
    if (handle) {
      handle.abort();
      runnerHandles.delete(sessionId);
    }

    // Always try to delete and emit deleted event
    // Don't emit error if session doesn't exist - it may have already been deleted
    getSessions().deleteSession(sessionId);
    emit({
      type: "session.deleted",
      payload: { sessionId }
    });
    return;
  }

  if (event.type === "permission.response") {
    const session = getSessions().getSession(event.payload.sessionId);
    if (!session) return;

    const pending = session.pendingPermissions.get(event.payload.toolUseId);
    if (pending) {
      pending.resolve(event.payload.result);
    }
    return;
  }

  // File search using fd (Rust)
  if (event.type === "fd.find") {
    try {
      const options = event.payload.options || {};
      const files = fdFind(event.payload.root, event.payload.pattern, {
        hidden: options.hidden,
        ext: options.ext,
        type: options.type,
        limit: options.limit
      });
      emit({
        type: "fd.find.result",
        payload: { files }
      });
    } catch (error) {
      emit({
        type: "fd.error",
        payload: { message: String(error) }
      });
    }
    return;
  }

  if (event.type === "fd.list") {
    try {
      const options = event.payload.options || {};
      const files = fdList(event.payload.root, {
        hidden: options.hidden,
        ext: options.ext,
        type: options.type,
        limit: options.limit
      });
      emit({
        type: "fd.list.result",
        payload: { files }
      });
    } catch (error) {
      emit({
        type: "fd.error",
        payload: { message: String(error) }
      });
    }
    return;
  }

  // RG handlers
  if (event.type === "rg.search") {
    try {
      const options = event.payload.options || {};
      const results = rgSearch(event.payload.root, event.payload.query, {
        ext: options.ext,
        glob: options.glob,
        context: options.context,
        caseSensitive: options.caseSensitive,
        limit: options.limit
      });
      emit({
        type: "rg.search.result",
        payload: { results }
      });
    } catch (error) {
      emit({
        type: "rg.error",
        payload: { message: String(error) }
      });
    }
    return;
  }

  if (event.type === "rg.files") {
    try {
      const options = event.payload.options || {};
      const files = rgFiles(event.payload.root, event.payload.pattern, {
        ext: options.ext
      });
      emit({
        type: "rg.files.result",
        payload: { files }
      });
    } catch (error) {
      emit({
        type: "rg.error",
        payload: { message: String(error) }
      });
    }
    return;
  }
}

export { getSessions as sessions };
