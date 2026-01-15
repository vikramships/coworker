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

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
    "generate-session-title": string;
    "get-recent-cwds": string[];
    "select-directory": string | null;
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
    "open-config-file": void;
}

interface Window {
    electron: {
        subscribeStatistics: (callback: (statistics: Statistics) => void) => UnsubscribeFunction;
        getStaticData: () => Promise<StaticData>;
        // Claude Agent IPC APIs
        sendClientEvent: (event: any) => void;
        onServerEvent: (callback: (event: any) => void) => UnsubscribeFunction;
        generateSessionTitle: (userInput: string | null) => Promise<string>;
        getRecentCwds: (limit?: number) => Promise<string[]>;
        selectDirectory: () => Promise<string | null>;
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
        openConfigFile: () => Promise<void>;
    }
}
