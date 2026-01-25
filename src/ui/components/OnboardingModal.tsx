import { useState } from "react";

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [aiName, setAiName] = useState("Claude");
  const [apiKey, setApiKey] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const steps = [
    { title: "Welcome to Coworker", description: "Let's set up your AI coding assistant" },
    { title: "Your Identity", description: "Who are you working with?" },
    { title: "AI Settings", description: "Configure your AI assistant" },
    { title: "API Configuration", description: "Connect to Anthropic API" },
    { title: "Theme", description: "Choose your look" },
  ];

  const handleNext = async () => {
    if (step === steps.length - 1) {
      await handleComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");
    try {
      // Save all settings
      await Promise.all([
        window.electron.saveUserProfile({ name: userName }),
        window.electron.saveAiProfile({ name: aiName }),
        window.electron.saveTheme(theme),
        window.electron.completeOnboarding(),
      ]);
      onComplete();
    } catch (err) {
      setError("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Skip onboarding but still mark as complete
    await window.electron.completeOnboarding();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-surface rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-surface-secondary">
          <div
            className="h-full bg-accent-500 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-accent-500 uppercase tracking-wider">
              Step {step + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-muted hover:text-ink-600 transition-colors"
            >
              Skip setup
            </button>
          </div>
          <h2 className="text-xl font-semibold text-ink-800">{steps[step].title}</h2>
          <p className="text-sm text-muted mt-1">{steps[step].description}</p>
        </div>

        {/* Content */}
        <div className="px-8 py-4">
          {step === 0 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-3xl bg-[#0F0F1A] flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/5">
                <svg className="h-10 w-10" viewBox="0 0 512 512" fill="none">
                  <path d="M360 160C330 130 290 120 245 120C165 120 105 180 105 256C105 332 165 392 245 392C290 392 330 382 360 352"
                    stroke="#F5A623" strokeWidth="56" strokeLinecap="round" />
                  <rect x="250" y="232" width="130" height="48" rx="24" fill="#F5A623" />
                </svg>
              </div>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Coworker helps you build software with AI. Configure your setup to get started.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-ink-700">Your Name</span>
                <input
                  type="text"
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-3 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
                <span className="text-xs text-muted">This helps the AI personalize responses</span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-ink-700">AI Assistant Name</span>
                <input
                  type="text"
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-3 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                  placeholder="Claude"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                />
                <span className="text-xs text-muted">What should the AI call itself?</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                <p className="text-sm text-ink-700">
                  You'll need an <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Anthropic API key</a> to use Coworker.
                </p>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-ink-700">API Key</span>
                <input
                  type="password"
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-3 text-sm text-ink-800 focus:border-accent-500 focus:outline-none font-mono"
                  placeholder="sk-ant-api03-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </label>
              {error && (
                <p className="text-sm text-error">{error}</p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-3">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
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
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-ink-900/10 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              step === 0 ? "text-muted-light cursor-not-allowed" : "text-ink-600 hover:text-ink-800"
            }`}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeLinecap="round" />
                </svg>
                Saving...
              </>
            ) : step === steps.length - 1 ? (
              "Get Started"
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
