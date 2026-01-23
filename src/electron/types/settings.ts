export interface AppSettings {
  // API Configuration
  apiBaseUrl: string;
  apiKey: string;
  modelProvider: ModelProvider;
  customModel?: string;

  // UI Preferences
  theme: Theme;

  // Advanced
  timeoutMs: number;
}

export type ModelProvider = "claude" | "zai" | "minimax" | "custom";

export type Theme = "light" | "dark" | "system";

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: "https://api.anthropic.com",
  apiKey: "",
  modelProvider: "claude",
  theme: "system",
  timeoutMs: 120000,
};
