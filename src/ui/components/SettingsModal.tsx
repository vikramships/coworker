import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";


interface SettingsModalProps {
  onClose: () => void;
}

type Theme = "light" | "dark" | "system";

interface ProviderConfig {
  id: string;
  name: string;
  apiType: "anthropic" | "openai-compatible";
  apiKey: string;
  baseURL: string;
  model: string;
}

interface AppConfig {
  activeProvider: string;
  providers: ProviderConfig[];
  theme?: Theme;
}

type SettingsTab = "identity" | "providers" | "preferences" | "appearance";

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { userProfile, aiProfile, setUserProfile, setAiProfile } = useAppStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("identity");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [addingProvider, setAddingProvider] = useState(false);

  // Form state for editing/adding provider
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formBaseURL, setFormBaseURL] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formApiType, setFormApiType] = useState<"anthropic" | "openai-compatible">("anthropic");

  const theme = config?.theme || "system";

  const populateFormFromProvider = useCallback((provider: ProviderConfig) => {
    setFormId(provider.id);
    setFormName(provider.name);
    setFormApiKey(provider.apiKey);
    setFormBaseURL(provider.baseURL);
    setFormModel(provider.model);
    setFormApiType(provider.apiType);
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const appConfig = await window.electron.getAppConfig();
      setConfig(appConfig);
      if (appConfig && appConfig.providers.length > 0) {
        const active = appConfig.providers.find(p => p.id === appConfig.activeProvider);
        if (active) {
          populateFormFromProvider(active);
        }
      }
    } catch (err) {
      console.error("Failed to load config:", err);
      setError("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  }, [populateFormFromProvider]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleEditProvider = (provider: ProviderConfig) => {
    setEditingProviderId(provider.id);
    setAddingProvider(false);
    populateFormFromProvider(provider);
  };

  const handleAddProvider = () => {
    const newId = `provider-${Date.now()}`;
    setFormId(newId);
    setFormName("");
    setFormApiKey("");
    setFormBaseURL(formApiType === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com/v1");
    setFormModel("");
    setFormApiType("anthropic");
    setAddingProvider(true);
    setEditingProviderId(null);
  };

  const handleCancelEdit = () => {
    setEditingProviderId(null);
    setAddingProvider(false);
    if (config?.activeProvider) {
      const active = config.providers.find(p => p.id === config.activeProvider);
      if (active) populateFormFromProvider(active);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!config || config.providers.length <= 1) {
      setError("Cannot delete the last provider");
      return;
    }

    try {
      const result = await window.electron.removeProvider(providerId);
      if (result.success) {
        await loadConfig();
      } else {
        setError(result.error || "Failed to delete provider");
      }
    } catch (err) {
      console.error("Failed to delete provider:", err);
      setError("Failed to delete provider");
    }
  };

  const handleSelectProvider = async (providerId: string) => {
    if (!config) return;

    try {
      const newConfig = { ...config, activeProvider: providerId };
      const result = await window.electron.saveAppConfig(newConfig);
      if (result.success) {
        setConfig(newConfig);
        const selected = config.providers.find(p => p.id === providerId);
        if (selected) {
          populateFormFromProvider(selected);
        }
      } else {
        setError("Failed to select provider");
      }
    } catch (err) {
      console.error("Failed to select provider:", err);
      setError("Failed to select provider");
    }
  };

  const handleSaveProvider = async () => {
    if (!formName || !formApiKey) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const provider: ProviderConfig = {
        id: formId,
        name: formName,
        apiKey: formApiKey,
        baseURL: formBaseURL,
        model: formModel,
        apiType: formApiType
      };

      let newProviders: ProviderConfig[];
      if (addingProvider) {
        newProviders = [...(config?.providers || []), provider];
      } else {
        newProviders = (config?.providers || []).map(p => p.id === formId ? provider : p);
      }

      const newConfig = {
        activeProvider: addingProvider ? formId : config?.activeProvider || formId,
        providers: newProviders,
        theme: config?.theme
      };

      const result = await window.electron.saveAppConfig(newConfig);
      if (result.success) {
        setEditingProviderId(null);
        setAddingProvider(false);
        await loadConfig();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to save provider");
      }
    } catch (err) {
      console.error("Failed to save provider:", err);
      setError("Failed to save provider");
    }
  };

  const handleThemeChange = async (newTheme: Theme) => {
    try {
      const result = await window.electron.saveTheme(newTheme);
      if (result.success) {
        setConfig(config ? { ...config, theme: newTheme } : null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Failed to save theme");
      }
    } catch (err) {
      console.error("Failed to save theme:", err);
      setError("Failed to save theme");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-surface rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-900/10 bg-surface-secondary/50">
          <h2 className="text-lg font-semibold text-ink-800">Settings</h2>
          <button
            className="p-2 rounded-lg text-muted hover:text-ink-600 hover:bg-surface-secondary transition-colors"
            onClick={onClose}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ink-900/10 px-2 bg-surface-secondary/30">
          {([
            ["identity", "Identity"],
            ["providers", "Providers"],
            ["preferences", "Preferences"],
            ["appearance", "Appearance"],
          ] as [SettingsTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-accent-500 text-accent-600"
                  : "border-transparent text-muted hover:text-ink-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-error-light border border-error/20 text-sm text-error">
                  {error}
                  <button className="float-right hover:text-error" onClick={() => setError(null)}>×</button>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-lg bg-success-light border border-success/20 text-sm text-success">
                  Settings saved successfully
                </div>
              )}

              {/* Identity Tab */}
              {activeTab === "identity" && (
                <div className="grid gap-6">
                  <div className="grid gap-4">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider">Your Profile</p>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-ink-700">Your Name</span>
                      <input
                        type="text"
                        className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-3 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                        placeholder="Enter your name"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({ name: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="grid gap-4">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider">AI Assistant</p>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-ink-700">Assistant Name</span>
                      <input
                        type="text"
                        className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-3 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                        placeholder="Coworker"
                        value={aiProfile.name}
                        onChange={(e) => setAiProfile({ name: e.target.value })}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Providers Tab */}
              {activeTab === "providers" && (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider">API Providers</p>
                    <button
                      onClick={handleAddProvider}
                      className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Add Provider
                    </button>
                  </div>

                  {/* Provider List */}
                  {config?.providers.map((provider) => (
                    <div
                      key={provider.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        config.activeProvider === provider.id
                          ? "border-accent bg-accent/5"
                          : "border-ink-900/10 hover:bg-surface-secondary"
                      }`}
                      onClick={() => handleSelectProvider(provider.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {config.activeProvider === provider.id && (
                            <span className="w-2 h-2 rounded-full bg-success" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-ink-700">{provider.name}</div>
                            <div className="text-xs text-muted">{provider.baseURL || "No URL set"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-surface-secondary text-muted">
                            {provider.apiType === "anthropic" ? "Anthropic" : "OpenAI"}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProvider(provider);
                            }}
                            className="p-2 rounded-lg text-muted hover:text-ink-600 hover:bg-surface transition-colors"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add/Edit Form */}
                  {(editingProviderId || addingProvider) && (
                    <div className="p-4 rounded-xl border border-accent bg-accent/5 mt-4">
                      <p className="text-sm font-medium text-ink-700 mb-4">
                        {addingProvider ? "Add New Provider" : "Edit Provider"}
                      </p>

                      <div className="grid gap-4">
                        <label className="grid gap-2">
                          <span className="text-xs text-muted">Provider Name</span>
                          <input
                            type="text"
                            className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                            placeholder="My Provider"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs text-muted">API Format</span>
                          <select
                            className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                            value={formApiType}
                            onChange={(e) => {
                              setFormApiType(e.target.value as "anthropic" | "openai-compatible");
                              if (e.target.value === "anthropic") {
                                setFormBaseURL("https://api.anthropic.com");
                              } else {
                                setFormBaseURL("https://api.openai.com/v1");
                              }
                            }}
                          >
                            <option value="anthropic">Anthropic API</option>
                            <option value="openai-compatible">OpenAI-Compatible API</option>
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs text-muted">API Key</span>
                          <input
                            type="password"
                            className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent-500 focus:outline-none font-mono"
                            placeholder="sk-..."
                            value={formApiKey}
                            onChange={(e) => setFormApiKey(e.target.value)}
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs text-muted">Base URL</span>
                          <input
                            type="url"
                            className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                            placeholder="https://api.anthropic.com"
                            value={formBaseURL}
                            onChange={(e) => setFormBaseURL(e.target.value)}
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs text-muted">Model</span>
                          <input
                            type="text"
                            className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                            placeholder="sonnet-4-20250514"
                            value={formModel}
                            onChange={(e) => setFormModel(e.target.value)}
                          />
                        </label>

                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleSaveProvider}
                            className="flex-1 rounded-lg bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 text-sm font-medium transition-colors"
                          >
                            Save
                          </button>
                          {!addingProvider && config && config.providers.length > 1 && (
                            <button
                              onClick={() => handleDeleteProvider(formId)}
                              className="px-4 py-2 rounded-lg border border-error/20 bg-error-light text-error text-sm font-medium transition-colors hover:bg-error/10"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 rounded-lg border border-ink-900/10 bg-surface hover:bg-surface-secondary text-ink-700 text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div className="grid gap-4">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">Preferences</p>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-ink-700">Default Working Directory</span>
                    <input
                      type="text"
                      className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-3 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                      placeholder="~/projects"
                      defaultValue="~"
                    />
                  </label>

                  {/* Auto-save toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm text-ink-700">Auto-save conversations</div>
                      <div className="text-xs text-muted">Automatically save chat history</div>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-accent-500 transition-colors relative">
                      <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Syntax highlighting toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm text-ink-700">Syntax highlighting</div>
                      <div className="text-xs text-muted">Colorize code blocks in chat</div>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-accent-500 transition-colors relative">
                      <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="grid gap-4">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">Theme</p>

                  <div className="grid gap-3">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleThemeChange(t)}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          theme === t
                            ? "border-accent bg-accent/5"
                            : "border-ink-900/10 hover:bg-surface-secondary"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          t === "light" ? "bg-surface-secondary" : t === "dark" ? "bg-ink-800" : "bg-gradient-to-br from-surface-secondary to-ink-800"
                        }`}>
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {t === "light" && <circle cx="12" cy="12" r="5" />}
                            {t === "dark" && <circle cx="12" cy="12" r="8" />}
                            {t === "system" && (
                              <>
                                <circle cx="12" cy="12" r="5" className="dark:hidden" />
                                <circle cx="12" cy="12" r="8" className="hidden dark:block" />
                              </>
                            )}
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-ink-700 capitalize">{t}</div>
                          <div className="text-xs text-muted">
                            {t === "light" && "Always use light mode"}
                            {t === "dark" && "Always use dark mode"}
                            {t === "system" && "Match system appearance"}
                          </div>
                        </div>
                        {theme === t && (
                          <svg className="h-5 w-5 ml-auto text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
