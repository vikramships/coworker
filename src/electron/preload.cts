import electron from "electron";

// Restore prototype chain for parsed objects to fix [object Object] issue
// JSON.parse returns plain objects, losing class prototypes and methods
function restoreObjectPrototypes(obj: any): any {
    if (obj === null || typeof obj !== "object") return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => restoreObjectPrototypes(item));
    }

    // Restore SDKMessage prototype based on type
    if (obj.type === "assistant" || obj.type === "user" || obj.type === "result" || obj.type === "system") {
        Object.setPrototypeOf(obj, Object.prototype);
    }

    // Restore content blocks for assistant/user messages
    if (obj.message?.content && Array.isArray(obj.message.content)) {
        for (const content of obj.message.content) {
            if (content && typeof content === "object") {
                Object.setPrototypeOf(content, Object.prototype);
                // Restore nested tool_use input
                if (content.type === "tool_use" && content.input && typeof content.input === "object") {
                    Object.setPrototypeOf(content.input, Object.prototype);
                }
                // Restore nested tool_result content
                if (content.type === "tool_result" && Array.isArray(content.content)) {
                    for (const item of content.content) {
                        if (item && typeof item === "object") {
                            Object.setPrototypeOf(item, Object.prototype);
                        }
                    }
                }
            }
        }
    }

    // Recursively process all properties
    for (const key of Object.keys(obj)) {
        obj[key] = restoreObjectPrototypes(obj[key]);
    }

    return obj;
}

function restoreServerEventPrototypes(event: any): any {
    if (event?.payload?.message) {
        event.payload.message = restoreObjectPrototypes(event.payload.message);
    }
    // Handle session.history which contains messages array
    if (event?.payload?.messages && Array.isArray(event.payload.messages)) {
        event.payload.messages = event.payload.messages.map((msg: any) => restoreObjectPrototypes(msg));
    }
    return event;
}

electron.contextBridge.exposeInMainWorld("electron", {
    subscribeStatistics: (callback) =>
        ipcOn("statistics", stats => {
            callback(stats);
        }),
    getStaticData: () => ipcInvoke("getStaticData"),

    // Agent IPC APIs
    sendClientEvent: (event: any) => {
        electron.ipcRenderer.send("client-event", event);
    },
    onServerEvent: (callback: (event: any) => void) => {
        const cb = (_: Electron.IpcRendererEvent, payload: string) => {
            try {
                const event = JSON.parse(payload);
                restoreServerEventPrototypes(event);
                callback(event);
            } catch (error) {
                console.error("Failed to parse server event:", error);
            }
        };
        electron.ipcRenderer.on("server-event", cb);
        return () => electron.ipcRenderer.off("server-event", cb);
    },
    generateSessionTitle: (userInput: string | null) =>
        ipcInvoke("generate-session-title", userInput),
    getRecentCwds: (limit?: number) =>
        ipcInvoke("get-recent-cwds", limit),
    getHomeDir: () =>
        ipcInvoke("get-home-dir"),
    executeCommand: (payload: { command: string; cwd: string; timeout?: number }) =>
        ipcInvoke("execute-command", payload),
    selectDirectory: () =>
        ipcInvoke("select-directory"),
    selectImage: () =>
        ipcInvoke("select-image"),
    // Full AppConfig APIs (multi-provider)
    getAppConfig: () =>
        ipcInvoke("get-app-config"),
    saveAppConfig: (config: any) =>
        ipcInvoke("save-app-config", config),
    addProvider: (provider: any) =>
        ipcInvoke("add-provider", provider),
    removeProvider: (providerId: string) =>
        ipcInvoke("remove-provider", providerId),

    // Legacy API config (single provider)
    getApiConfig: () =>
        ipcInvoke("get-api-config"),
    saveApiConfig: (config: any) =>
        ipcInvoke("save-api-config", config),

    // Theme APIs
    getTheme: () =>
        ipcInvoke("get-theme"),
    saveTheme: (theme: "light" | "dark" | "system") =>
        ipcInvoke("save-theme", theme),
    onThemeChanged: (callback: (theme: "light" | "dark") => void) => {
        const cb = (_: Electron.IpcRendererEvent, theme: "light" | "dark") => callback(theme);
        electron.ipcRenderer.on("theme-changed", cb);
        return () => electron.ipcRenderer.off("theme-changed", cb);
    },

    // Full config APIs (onboarding & settings)
    getFullConfig: () =>
        ipcInvoke("get-full-config"),
    hasCompletedOnboarding: () =>
        ipcInvoke("has-completed-onboarding"),
    completeOnboarding: () =>
        ipcInvoke("complete-onboarding"),
    saveUserProfile: (profile: { name: string }) =>
        ipcInvoke("save-user-profile", profile),
    saveAiProfile: (profile: { name: string }) =>
        ipcInvoke("save-ai-profile", profile),
    getPreferences: () =>
        ipcInvoke("get-preferences"),
    savePreferences: (prefs: {
        defaultWorkingDir?: string;
        terminalShell?: string;
        autoSaveConversations?: boolean;
        syntaxHighlighting?: boolean;
        wordWrap?: boolean;
    }) =>
        ipcInvoke("save-preferences", prefs),

    // File operations for IDE mode
    readFile: (filePath: string) =>
        ipcInvoke("read-file", filePath),
    writeFile: (filePath: string, content: string) =>
        ipcInvoke("write-file", filePath, content),
    listFiles: (dirPath: string) =>
        ipcInvoke("list-files", dirPath),
    getFileStats: (filePath: string) =>
        ipcInvoke("get-file-stats", filePath),

    openConfigFile: () =>
        ipcInvoke("open-config-file"),

    // Native module functions (loaded dynamically)
    nativeReadFile: (path: string) =>
        ipcInvoke("native-read-file", path),
    nativeWriteFile: (path: string, content: string) =>
        ipcInvoke("native-write-file", path, content),
    nativeListDir: (path: string) =>
        ipcInvoke("native-list-dir", path),
    nativeFileExists: (path: string) =>
        ipcInvoke("native-file-exists", path),
    nativeSearchFiles: (root: string, pattern: string, maxDepth?: number) =>
        ipcInvoke("native-search-files", { root, pattern, maxDepth }),
    nativeGetPlatform: () =>
        ipcInvoke("native-get-platform"),
    nativeGetArch: () =>
        ipcInvoke("native-get-arch"),
} satisfies Window['electron'])

function ipcInvoke<Key extends keyof EventPayloadMapping>(key: Key, ...args: any[]): Promise<EventPayloadMapping[Key]> {
    return electron.ipcRenderer.invoke(key, ...args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(key: Key, callback: (payload: EventPayloadMapping[Key]) => void) {
    const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload)
    electron.ipcRenderer.on(key, cb);
    return () => electron.ipcRenderer.off(key, cb)
}
