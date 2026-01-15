import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.electron.getTheme()
      .then((initialTheme) => {
        setTheme(initialTheme);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = window.electron.onThemeChanged((newTheme) => {
      setTheme(newTheme);
    });
    return unsubscribe;
  }, []);

  const updateTheme = async (newTheme: "light" | "dark" | "system") => {
    const result = await window.electron.saveTheme(newTheme);
    if (result.success && result.theme) {
      setTheme(result.theme);
    }
  };

  return { theme, setTheme: updateTheme, isLoading };
}
