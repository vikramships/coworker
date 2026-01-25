type Statistics = {
    cpuUsage: number;
    ramUsage: number;
    storageData: number;
}

type StaticData = {
    totalStorage: number;
    cpuModel: string;
    totalMemoryGB: number;
}

type UnsubscribeFunction = () => void;

type Theme = "light" | "dark" | "system";

type ProviderConfig = {
    id: string;
    name: string;
    apiType: "anthropic" | "openai-compatible";
    apiKey: string;
    baseURL: string;
    model: string;
};

type AppConfig = {
    activeProvider: string;
    providers: ProviderConfig[];
    theme?: Theme;
};

type UserProfile = {
    name: string;
};

type AiProfile = {
    name: string;
};

type AppPreferences = {
    defaultWorkingDir: string;
    terminalShell: string;
    autoSaveConversations: boolean;
    syntaxHighlighting: boolean;
    wordWrap: boolean;
};

type FullConfig = {
    version: string;
    hasCompletedOnboarding: boolean;
    userProfile: UserProfile;
    aiProfile: AiProfile;
    preferences: AppPreferences;
    api: AppConfig;
};

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
    "generate-session-title": string;
    "get-recent-cwds": string[];
    "get-home-dir": string;
    "execute-command": { success: boolean; stdout?: string; stderr?: string; error?: string; cwd?: string };
    "select-directory": string | null;
    "select-image": string | null;

    // Multi-provider APIs
    "get-app-config": AppConfig | null;
    "save-app-config": { success: boolean; error?: string };
    "add-provider": { success: boolean; error?: string };
    "remove-provider": { success: boolean; error?: string };
    // Legacy single-provider APIs
    "get-api-config": { apiKey: string; baseURL: string; model: string; apiType?: "anthropic" | "openai-compatible"; theme?: Theme } | null;
    "save-api-config": { success: boolean; error?: string };
    "get-theme": "light" | "dark";
    "save-theme": { success: boolean; error?: string; theme?: "light" | "dark" };
    // Full config APIs (onboarding & settings)
    "get-full-config": FullConfig;
    "has-completed-onboarding": boolean;
    "complete-onboarding": { success: boolean };
    "save-user-profile": { success: boolean; error?: string };
    "save-ai-profile": { success: boolean; error?: string };
    "get-preferences": AppPreferences;
    "save-preferences": { success: boolean; error?: string };
    // File operations for IDE mode
    "read-file": { success: boolean; content?: string; error?: string };
    "write-file": { success: boolean; error?: string };
    "list-files": { success: boolean; items?: Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }>; error?: string };
    "get-file-stats": { success: boolean; stats?: { size: number; isDirectory: boolean; isFile: boolean; mtime: number }; error?: string };
    "open-config-file": void;
    // Native fast operations (Rust-based)
    "native-read-file": { success: boolean; content?: string; error?: string };
    "native-write-file": { success: boolean; error?: string };
    "native-list-dir": { success: boolean; entries?: string[]; error?: string };
    "native-file-exists": boolean;
    "native-search-files": string[];
    "native-get-platform": string;
    "native-get-arch": string;
}

interface Window {
    electron: {
        subscribeStatistics: (callback: (statistics: Statistics) => void) => UnsubscribeFunction;
        getStaticData: () => Promise<StaticData>;
        // Agent IPC APIs
        sendClientEvent: (event: any) => void;
        onServerEvent: (callback: (event: any) => void) => UnsubscribeFunction;
        generateSessionTitle: (userInput: string | null) => Promise<string>;
        getRecentCwds: (limit?: number) => Promise<string[]>;
        getHomeDir: () => Promise<string>;
        executeCommand: (payload: { command: string; cwd: string; timeout?: number }) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string; cwd?: string }>;
        selectDirectory: () => Promise<string | null>;
        selectImage: () => Promise<string | null>;

        // Multi-provider APIs
        getAppConfig: () => Promise<AppConfig | null>;
        saveAppConfig: (config: AppConfig) => Promise<{ success: boolean; error?: string }>;
        addProvider: (provider: ProviderConfig) => Promise<{ success: boolean; error?: string }>;
        removeProvider: (providerId: string) => Promise<{ success: boolean; error?: string }>;
        // Legacy single-provider APIs
        getApiConfig: () => Promise<{ apiKey: string; baseURL: string; model: string; apiType?: "anthropic" | "openai-compatible"; theme?: Theme } | null>;
        saveApiConfig: (config: { apiKey: string; baseURL: string; model: string; apiType?: "anthropic" | "openai-compatible"; theme?: Theme }) => Promise<{ success: boolean; error?: string }>;
        // Theme APIs
        getTheme: () => Promise<"light" | "dark">;
        saveTheme: (theme: Theme) => Promise<{ success: boolean; error?: string; theme?: "light" | "dark" }>;
        onThemeChanged: (callback: (theme: "light" | "dark") => void) => UnsubscribeFunction;
        // Full config APIs (onboarding & settings)
        getFullConfig: () => Promise<FullConfig>;
        hasCompletedOnboarding: () => Promise<boolean>;
        completeOnboarding: () => Promise<{ success: boolean }>;
        saveUserProfile: (profile: UserProfile) => Promise<{ success: boolean; error?: string }>;
        saveAiProfile: (profile: AiProfile) => Promise<{ success: boolean; error?: string }>;
        getPreferences: () => Promise<AppPreferences>;
        savePreferences: (prefs: Partial<AppPreferences>) => Promise<{ success: boolean; error?: string }>;
        // File operations for IDE mode
        readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
        writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        listFiles: (dirPath: string) => Promise<{ success: boolean; items?: Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }>; error?: string }>;
        getFileStats: (filePath: string) => Promise<{ success: boolean; stats?: { size: number; isDirectory: boolean; isFile: boolean; mtime: number }; error?: string }>;
        openConfigFile: () => Promise<void>;
        // Native fast operations (Rust-based, no subprocess)
        nativeReadFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
        nativeWriteFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
        nativeListDir: (path: string) => Promise<{ success: boolean; entries?: string[]; error?: string }>;
        nativeFileExists: (path: string) => Promise<boolean>;
        nativeSearchFiles: (root: string, pattern: string, maxDepth?: number) => Promise<string[]>;
        nativeGetPlatform: () => Promise<string>;
        nativeGetArch: () => Promise<string>;
    }
}
