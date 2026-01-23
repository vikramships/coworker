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

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { userProfile, aiProfile, setUserProfile, setAiProfile } = useAppStore();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (!formApiKey.trim()) {
      setError("API Key is required");
      return;
    }
    if (!formBaseURL.trim()) {
      setError("Base URL is required");
      return;
    }
    if (!formModel.trim()) {
      setError("Model is required");
      return;
    }

    try {
      new URL(formBaseURL);
    } catch {
      setError("Invalid Base URL format");
      return;
    }

    setError(null);
    setSaving(true);

    const provider: ProviderConfig = {
      id: addingProvider ? formId : editingProviderId || formId,
      name: formName.trim() || "Unnamed Provider",
      apiKey: formApiKey.trim(),
      baseURL: formBaseURL.trim(),
      model: formModel.trim(),
      apiType: formApiType
    };

    try {
      if (addingProvider) {
        const result = await window.electron.addProvider(provider);
        if (!result.success) {
          setError(result.error || "Failed to add provider");
          setSaving(false);
          return;
        }
      } else {
        const newProviders = config?.providers.map(p =>
          p.id === editingProviderId ? provider : p
        ) || [provider];
        const newActiveProvider = config?.activeProvider === editingProviderId ? provider.id : (config?.activeProvider || provider.id);
        const result = await window.electron.saveAppConfig({
          activeProvider: newActiveProvider,
          providers: newProviders,
          theme: config?.theme
        });
        if (!result.success) {
          setError("Failed to save provider");
          setSaving(false);
          return;
        }
      }

      await loadConfig();
      setEditingProviderId(null);
      setAddingProvider(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
    } catch (err) {
      console.error("Failed to save provider:", err);
      setError("Failed to save provider");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: Theme) => {
    try {
      const result = await window.electron.saveTheme(newTheme);
      if (result.success && result.theme) {
        setConfig(config ? { ...config, theme: newTheme } : null);
      }
    } catch (err) {
      console.error("Failed to update theme:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-ink-900/10 bg-surface p-6 shadow-xl my-auto max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-ink-800">Settings</div>
          <button
            className="rounded-full p-1.5 text-muted hover:bg-surface-tertiary hover:text-ink-700 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
            type="button"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">Configure API providers and app preferences.</p>

        {loading ? (
          <div className="mt-5 flex items-center justify-center py-8">
            <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 100 101" fill="none">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z" fill="currentColor" opacity="0.3" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
            </svg>
          </div>
        ) : (
          <div className="mt-5 grid gap-5">
            {/* Identity Profile Section */}
            <div className="grid gap-4 border-b border-ink-900/10 pb-5">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Identity</p>

              <div className="grid grid-cols-2 gap-6">
                {/* User Profile */}
                <div className="grid gap-3">
                  <span className="text-[11px] font-medium text-ink-500">Your Identity</span>
                  <input
                    type="text"
                    className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-1.5 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                    placeholder="Your Name"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ name: e.target.value })}
                  />

                </div>

                {/* AI Profile */}
                <div className="grid gap-3">
                  <span className="text-[11px] font-medium text-ink-500">AI Identity</span>
                  <input
                    type="text"
                    className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-1.5 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                    placeholder="AI Name"
                    value={aiProfile.name}
                    onChange={(e) => setAiProfile({ name: e.target.value })}
                  />

                </div>
              </div>
            </div>

            {/* Theme Section */}
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">Theme</span>
              <div className="flex gap-2">
                {(["light", "dark", "system"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${theme === t
                      ? "border-accent bg-accent/10 text-ink-800"
                      : "border-ink-900/10 bg-surface text-ink-700 hover:bg-surface-tertiary"
                      }`}
                    onClick={() => handleThemeChange(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </label>

            <div className="border-t border-ink-900/10 pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted">API Providers</p>
                <button
                  type="button"
                  className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
                  onClick={handleAddProvider}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Provider
                </button>
              </div>

              {/* Provider List */}
              {config?.providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-3 rounded-xl border transition-colors mb-2 cursor-pointer ${config.activeProvider === provider.id
                    ? "border-accent bg-accent/5"
                    : "border-ink-900/10 hover:bg-surface-tertiary"
                    }`}
                  onClick={() => handleSelectProvider(provider.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {config.activeProvider === provider.id && (
                        <span className="w-2 h-2 rounded-full bg-success" />
                      )}
                      <span className="text-sm font-medium text-ink-700">{provider.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-surface-tertiary text-muted">
                        {provider.apiType === "anthropic" ? "Anthropic" : "OpenAI"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-surface text-muted hover:text-ink-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProvider(provider);
                        }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-error/10 text-muted hover:text-error transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProvider(provider.id);
                        }}
                        disabled={config.providers.length <= 1}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-1 truncate">{provider.baseURL}</p>
                </div>
              ))}

              {/* Edit/Add Form */}
              {(editingProviderId || addingProvider) && (
                <div className="p-4 rounded-xl border border-accent bg-accent/5 mt-3">
                  <p className="text-xs font-medium text-muted mb-3">
                    {addingProvider ? "Add New Provider" : "Edit Provider"}
                  </p>

                  <div className="grid gap-3">
                    <label className="grid gap-1">
                      <span className="text-xs text-muted">Provider Name</span>
                      <input
                        type="text"
                        className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none"
                        placeholder="My Provider"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-xs text-muted">API Format</span>
                      <select
                        className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none"
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

                    <label className="grid gap-1">
                      <span className="text-xs text-muted">API Key</span>
                      <input
                        type="password"
                        className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none"
                        placeholder="sk-..."
                        value={formApiKey}
                        onChange={(e) => setFormApiKey(e.target.value)}
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-xs text-muted">Base URL</span>
                      <input
                        type="url"
                        className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none"
                        placeholder="https://api.anthropic.com"
                        value={formBaseURL}
                        onChange={(e) => setFormBaseURL(e.target.value)}
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-xs text-muted">Model</span>
                      <input
                        type="text"
                        className="rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none"
                        placeholder="claude-3-5-sonnet-20241022"
                        value={formModel}
                        onChange={(e) => setFormModel(e.target.value)}
                      />
                    </label>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        className="flex-1 rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm font-medium text-ink-700 hover:bg-surface-tertiary transition-colors"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
                        onClick={handleSaveProvider}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
                Configuration saved successfully!
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-tertiary transition-colors"
                onClick={onClose}
                disabled={saving}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
