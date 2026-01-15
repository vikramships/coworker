import electron from "electron";

electron.contextBridge.exposeInMainWorld("electron", {
    subscribeStatistics: (callback) =>
        ipcOn("statistics", stats => {
            callback(stats);
        }),
    getStaticData: () => ipcInvoke("getStaticData"),
    
    // Claude Agent IPC APIs
    sendClientEvent: (event: any) => {
        electron.ipcRenderer.send("client-event", event);
    },
    onServerEvent: (callback: (event: any) => void) => {
        const cb = (_: Electron.IpcRendererEvent, payload: string) => {
            try {
                const event = JSON.parse(payload);
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
    selectDirectory: () =>
        ipcInvoke("select-directory"),
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
    openConfigFile: () =>
        ipcInvoke("open-config-file")
} satisfies Window['electron'])

function ipcInvoke<Key extends keyof EventPayloadMapping>(key: Key, ...args: any[]): Promise<EventPayloadMapping[Key]> {
    return electron.ipcRenderer.invoke(key, ...args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(key: Key, callback: (payload: EventPayloadMapping[Key]) => void) {
    const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload)
    electron.ipcRenderer.on(key, cb);
    return () => electron.ipcRenderer.off(key, cb)
}
