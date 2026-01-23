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

const CONFIG_FILE_NAME = "coworker.json";

function getConfigPath(): string {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, CONFIG_FILE_NAME);
}

export function loadApiConfig(): AppConfig | null {
  try {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
      return null;
    }
    const raw = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);

    // Handle new multi-provider structure
    if (parsed.providers && Array.isArray(parsed.providers)) {
      return parsed as AppConfig;
    }

    // Handle new flat structure (backward compatibility)
    if (parsed.apiKey && parsed.baseURL && parsed.model) {
      const provider: ProviderConfig = {
        id: "default",
        name: "Default Provider",
        apiType: parsed.apiType || "anthropic",
        apiKey: parsed.apiKey,
        baseURL: parsed.baseURL,
        model: parsed.model
      };
      return {
        activeProvider: "default",
        providers: [provider],
        theme: parsed.theme
      };
    }

    // Fallback to old nested structure for backward compatibility
    if (parsed.api) {
      const provider: ProviderConfig = {
        id: "default",
        name: "Default Provider",
        apiType: parsed.api.provider || "anthropic",
        apiKey: parsed.api.key,
        baseURL: parsed.api.base_url,
        model: parsed.api.model
      };
      return {
        activeProvider: "default",
        providers: [provider],
        theme: parsed.ui?.theme
      };
    }

    return null;
  } catch (error) {
    console.error("[config-store] Failed to load API config:", error);
    return null;
  }
}

export function saveApiConfig(config: AppConfig): void {
  try {
    const configPath = getConfigPath();
    const userDataPath = app.getPath("userData");

    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true });
    }

    // Validate that we have at least one provider
    if (!config.providers || config.providers.length === 0) {
      throw new Error("Invalid config: at least one provider is required");
    }

    // Validate the active provider exists
    const activeProvider = config.providers.find(p => p.id === config.activeProvider);
    if (!activeProvider) {
      throw new Error("Invalid config: active provider not found");
    }

    // Create a clean, readable config structure
    const formattedConfig = {
      activeProvider: config.activeProvider,
      providers: config.providers,
      theme: config.theme || "system"
    };

    const jsonString = JSON.stringify(formattedConfig, null, 2);
    writeFileSync(configPath, jsonString, "utf8");
    console.info("[config-store] API config saved successfully");
  } catch (error) {
    console.error("[config-store] Failed to save API config:", error);
    throw error;
  }
}

export function deleteApiConfig(): void {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      unlinkSync(configPath);
      console.info("[config-store] API config deleted");
    }
  } catch (error) {
    console.error("[config-store] Failed to delete API config:", error);
  }
}

// Legacy compatibility: get the active provider as a single config
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
