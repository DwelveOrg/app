"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export default function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer ${
        isDark ? "bg-accent" : "bg-border"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full  transition-transform ${
          isDark ? "translate-x-4" : "translate-x-1"
        }`}
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun color="black" className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
