import { app } from "electron";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";

export type ApiType = "anthropic" | "openai-compatible";
export type Theme = "light" | "dark" | "system";

export type ProviderConfig = {
  id: string;
  name: string;
  apiType: ApiType;
  apiKey: string;
  baseURL: string;
  model: string;
};

export type AppConfig = {
  activeProvider: string;
  providers: ProviderConfig[];
  theme?: Theme;
};

export type UserProfile = {
  name: string;
};

export type AiProfile = {
  name: string;
};

export type AppPreferences = {
  defaultWorkingDir: string;
  terminalShell: string;
  autoSaveConversations: boolean;
  syntaxHighlighting: boolean;
  wordWrap: boolean;
};

export type FullConfig = {
  version: string;
  hasCompletedOnboarding: boolean;
  userProfile: UserProfile;
  aiProfile: AiProfile;
  preferences: AppPreferences;
  api: AppConfig;
};

const CONFIG_FILE_NAME = "coworker.json";
const CONFIG_VERSION = "1.0.0";

function getConfigPath(): string {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, CONFIG_FILE_NAME);
}

function getDefaultConfig(): FullConfig {
  return {
    version: CONFIG_VERSION,
    hasCompletedOnboarding: false,
    userProfile: { name: "" },
    aiProfile: { name: "Claude" },
    preferences: {
      defaultWorkingDir: "~",
      terminalShell: "bash",
      autoSaveConversations: true,
      syntaxHighlighting: true,
      wordWrap: false,
    },
    api: {
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
    }
  };
}

export function loadFullConfig(): FullConfig {
  try {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
      return getDefaultConfig();
    }
    const raw = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    
    // Merge with defaults for missing fields
    const defaults = getDefaultConfig();
    return {
      ...defaults,
      ...parsed,
      preferences: { ...defaults.preferences, ...(parsed.preferences || {}) },
      userProfile: { ...defaults.userProfile, ...(parsed.userProfile || {}) },
      aiProfile: { ...defaults.aiProfile, ...(parsed.aiProfile || {}) },
      api: parsed.api || defaults.api
    };
  } catch (error) {
    console.error("[config-store] Failed to load config:", error);
    return getDefaultConfig();
  }
}

export function saveFullConfig(config: FullConfig): void {
  try {
    const configPath = getConfigPath();
    const userDataPath = app.getPath("userData");

    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true });
    }

    const jsonString = JSON.stringify(config, null, 2);
    writeFileSync(configPath, jsonString, "utf8");
    console.info("[config-store] Config saved successfully");
  } catch (error) {
    console.error("[config-store] Failed to save config:", error);
    throw error;
  }
}

export function hasCompletedOnboarding(): boolean {
  const config = loadFullConfig();
  return config.hasCompletedOnboarding;
}

export function completeOnboarding(): void {
  const config = loadFullConfig();
  config.hasCompletedOnboarding = true;
  saveFullConfig(config);
}

export function getUserProfile(): UserProfile {
  return loadFullConfig().userProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  const config = loadFullConfig();
  config.userProfile = profile;
  saveFullConfig(config);
}

export function getAiProfile(): AiProfile {
  return loadFullConfig().aiProfile;
}

export function saveAiProfile(profile: AiProfile): void {
  const config = loadFullConfig();
  config.aiProfile = profile;
  saveFullConfig(config);
}

export function getPreferences(): AppPreferences {
  return loadFullConfig().preferences;
}

export function savePreferences(prefs: Partial<AppPreferences>): void {
  const config = loadFullConfig();
  config.preferences = { ...config.preferences, ...prefs };
  saveFullConfig(config);
}

// Legacy compatibility functions (for backward compatibility)
export function loadApiConfig(): AppConfig | null {
  const fullConfig = loadFullConfig();
  return fullConfig.api;
}

export function saveApiConfig(config: AppConfig): void {
  const fullConfig = loadFullConfig();
  fullConfig.api = config;
  saveFullConfig(fullConfig);
}

export function getActiveProviderConfig(): { apiKey: string; baseURL: string; model: string; apiType: ApiType } | null {
  const config = loadApiConfig();
  if (!config) return null;

  const activeProvider = config.providers.find(p => p.id === config.activeProvider);
  if (!activeProvider) return null;

  return {
    apiKey: activeProvider.apiKey,
    baseURL: activeProvider.baseURL,
    model: activeProvider.model,
    apiType: activeProvider.apiType
  };
}

export function getEffectiveTheme(theme: Theme = "system"): "light" | "dark" {
  if (theme !== "system") return theme;
  return "light";
}
