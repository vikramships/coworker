import { app, BrowserWindow, ipcMain, dialog, nativeTheme, type IpcMainInvokeEvent } from "electron"
import { ipcMainHandle, isDev, DEV_PORT } from "./util.js";
import { getPreloadPath, getUIPath, getIconPath } from "./pathResolver.js";
import { getStaticData, pollResources } from "./test.js";
import { handleClientEvent, sessions } from "./ipc-handlers.js";
import { generateSessionTitle } from "./libs/util.js";
import type { ClientEvent } from "./types.js";
import { loadApiConfig, saveApiConfig, type Theme, type ProviderConfig, type AppConfig } from "./libs/config-store.js";
import { shell } from "electron";
import { join, homedir } from "path";
import { writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { readFile as readFilePromise, writeFile as writeFilePromise } from "fs/promises";
import "./libs/claude-settings.js";

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: getPreloadPath(),
        },
        icon: getIconPath(),
        titleBarStyle: "hiddenInset",
        backgroundColor: "#FAF9F6",
        trafficLightPosition: { x: 15, y: 18 }
    });

    if (isDev()) mainWindow.loadURL(`http://localhost:${DEV_PORT}`)
    else mainWindow.loadFile(getUIPath());

    pollResources(mainWindow);

    ipcMainHandle("getStaticData", () => {
        return getStaticData();
    });

    // Handle client events
    ipcMain.on("client-event", (_, event: ClientEvent) => {
        handleClientEvent(event);
    });

    // Handle session title generation
    ipcMainHandle("generate-session-title", async (_: IpcMainInvokeEvent, userInput: string | null) => {
        return await generateSessionTitle(userInput);
    });

    // Handle recent cwds request
    ipcMainHandle("get-recent-cwds", (_: IpcMainInvokeEvent, limit?: number) => {
        const boundedLimit = limit ? Math.min(Math.max(limit, 1), 20) : 8;
        return sessions().listRecentCwds(boundedLimit);
    });

    // Handle get home directory
    ipcMainHandle("get-home-dir", () => {
        return homedir();
    });

    // Handle command execution
    ipcMainHandle("execute-command", async (_: IpcMainInvokeEvent, payload: { command: string; cwd: string; timeout?: number }) => {
        const { command, cwd, timeout = 30000 } = payload;
        try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            // Change to the specified directory
            process.chdir(cwd);

            const { stdout, stderr } = await execAsync(command, {
                timeout,
                maxBuffer: 1024 * 1024 // 1MB
            });

            return {
                success: true,
                stdout: stdout || '',
                stderr: stderr || '',
                cwd: process.cwd()
            };
        } catch (error: any) {
            // Handle timeout and other errors
            if (error.killed || error.signal === 'SIGTERM') {
                return {
                    success: false,
                    error: 'Command timed out',
                    stdout: error.stdout || '',
                    stderr: error.stderr || ''
                };
            }
            return {
                success: false,
                error: error.message || 'Unknown error',
                stdout: error.stdout || '',
                stderr: error.stderr || ''
            };
        }
    });

    // Handle directory selection
    ipcMainHandle("select-directory", async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });

        if (result.canceled) {
            return null;
        }

        return result.filePaths[0];
    });

    // Handle image selection for attachments
    ipcMainHandle("select-image", async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }
            ]
        });

        if (result.canceled) {
            return null;
        }

        return result.filePaths[0];
    });



    // Handle full AppConfig (multi-provider)
    ipcMainHandle("get-app-config", () => {
        return loadApiConfig();
    });

    ipcMainHandle("save-app-config", (_: IpcMainInvokeEvent, appConfig: AppConfig) => {
        try {
            saveApiConfig(appConfig);
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to save app config:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("add-provider", (_: IpcMainInvokeEvent, provider: ProviderConfig) => {
        try {
            const config = loadApiConfig();
            if (config) {
                const newProviders = [...config.providers, provider];
                saveApiConfig({ ...config, providers: newProviders });
            } else {
                const appConfig: AppConfig = {
                    activeProvider: provider.id,
                    providers: [provider],
                    theme: "system"
                };
                saveApiConfig(appConfig);
            }
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to add provider:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("remove-provider", (_: IpcMainInvokeEvent, providerId: string) => {
        try {
            const config = loadApiConfig();
            if (!config) return { success: false, error: "No config found" };

            if (config.providers.length <= 1) {
                return { success: false, error: "Cannot remove the last provider" };
            }

            const newProviders = config.providers.filter(p => p.id !== providerId);
            let newActiveProvider = config.activeProvider;
            if (config.activeProvider === providerId) {
                newActiveProvider = newProviders[0].id;
            }

            saveApiConfig({
                ...config,
                providers: newProviders,
                activeProvider: newActiveProvider
            });
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to remove provider:", error);
            return { success: false, error: String(error) };
        }
    });

    // Legacy API config handlers (for backward compatibility)
    ipcMainHandle("get-api-config", () => {
        const config = loadApiConfig();
        if (!config) return null;

        const activeProvider = config.providers.find(p => p.id === config.activeProvider);
        if (!activeProvider) return null;

        return {
            apiKey: activeProvider.apiKey,
            baseURL: activeProvider.baseURL,
            model: activeProvider.model,
            apiType: activeProvider.apiType,
            theme: config.theme
        };
    });

    ipcMainHandle("save-api-config", (_: IpcMainInvokeEvent, legacyConfig: {
        apiKey: string;
        baseURL: string;
        model: string;
        apiType?: "anthropic" | "openai-compatible";
        theme?: Theme;
    }) => {
        try {
            const provider: ProviderConfig = {
                id: "default",
                name: "Default Provider",
                apiType: legacyConfig.apiType || "anthropic",
                apiKey: legacyConfig.apiKey,
                baseURL: legacyConfig.baseURL,
                model: legacyConfig.model
            };

            const appConfig: AppConfig = {
                activeProvider: "default",
                providers: [provider],
                theme: legacyConfig.theme
            };

            saveApiConfig(appConfig);
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to save API config:", error);
            return { success: false, error: String(error) };
        }
    });

    // Handle theme
    const getEffectiveTheme = (): "light" | "dark" => {
        const config = loadApiConfig();
        const themePreference = config?.theme ?? "system";
        if (themePreference === "system") {
            return nativeTheme.shouldUseDarkColors ? "dark" : "light";
        }
        return themePreference;
    };

    ipcMainHandle("get-theme", () => {
        return getEffectiveTheme();
    });

    ipcMainHandle("save-theme", (_: IpcMainInvokeEvent, theme: Theme) => {
        try {
            const config = loadApiConfig();
            if (config) {
                saveApiConfig({ ...config, theme });
            } else {
                // Create default config with theme
                const defaultProvider: ProviderConfig = {
                    id: "default",
                    name: "Default Provider",
                    apiType: "anthropic",
                    apiKey: "",
                    baseURL: "",
                    model: ""
                };
                saveApiConfig({
                    activeProvider: "default",
                    providers: [defaultProvider],
                    theme
                });
            }
            const effectiveTheme = getEffectiveTheme();
            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send("theme-changed", effectiveTheme);
            });
            return { success: true, theme: effectiveTheme };
        } catch (error) {
            console.error("[main] Failed to save theme:", error);
            return { success: false, error: String(error) };
        }
    });

    // File operations for IDE mode
    ipcMainHandle("read-file", async (_: IpcMainInvokeEvent, filePath: string) => {
        try {
            const content = await readFilePromise(filePath, 'utf-8');
            return { success: true, content };
        } catch (error) {
            console.error("[main] Failed to read file:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("write-file", async (_: IpcMainInvokeEvent, filePath: string, content: string) => {
        try {
            await writeFilePromise(filePath, content, 'utf-8');
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to write file:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("list-files", async (_: IpcMainInvokeEvent, dirPath: string) => {
        try {
            const items = readdirSync(dirPath, { withFileTypes: true }).map(dirent => ({
                name: dirent.name,
                path: join(dirPath, dirent.name),
                isDirectory: dirent.isDirectory(),
                isFile: dirent.isFile()
            })).sort((a, b) => {
                if (a.isDirectory === b.isDirectory) {
                    return a.name.localeCompare(b.name);
                }
                return a.isDirectory ? -1 : 1;
            });
            return { success: true, items };
        } catch (error) {
            console.error("[main] Failed to list files:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("get-file-stats", async (_: IpcMainInvokeEvent, filePath: string) => {
        try {
            const stats = statSync(filePath);
            return {
                success: true,
                stats: {
                    size: stats.size,
                    isDirectory: stats.isDirectory(),
                    isFile: stats.isFile(),
                    mtime: stats.mtimeMs
                }
            };
        } catch (error) {
            console.error("[main] Failed to get file stats:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("open-config-file", async () => {
        const userDataPath = app.getPath("userData");
        const configPath = join(userDataPath, "coworker.json");

        // Ensure directory exists
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
        }

        // Create config file if it doesn't exist
        if (!existsSync(configPath)) {
            const defaultConfig = {
                activeProvider: "default",
                providers: [{
                    id: "default",
                    name: "Default Provider",
                    apiType: "anthropic",
                    apiKey: "",
                    baseURL: "",
                    model: ""
                }],
                theme: "system"
            };
            writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf8");
        }

        // Open the config file
        const error = await shell.openPath(configPath);
        if (error) {
            console.error("[main] Failed to open config file:", error);
            throw new Error("Failed to open config file");
        }
    });

    // Listen to system theme changes
    nativeTheme.on("updated", () => {
        const config = loadApiConfig();
        if (config?.theme === "system") {
            const effectiveTheme = getEffectiveTheme();
            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send("theme-changed", effectiveTheme);
            });
        }
    });
})
