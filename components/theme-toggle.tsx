"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}

function getSnapshot(): "light" | "dark" {
  const stored = localStorage.getItem("mestre-color-theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerSnapshot(): "light" | "dark" {
  return "dark";
}

export function ThemeToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("mestre-color-theme", next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${compact ? "compact" : ""} ${className}`}
      onClick={toggleTheme}
      aria-label={
        theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"
      }
      title={theme === "dark" ? "Ativar Modo Claro" : "Ativar Dark Studio"}
    >
      <span className="theme-toggle-icon">
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </span>
      {!compact && (
        <span className="theme-toggle-label">
          {theme === "dark" ? "Modo Claro" : "Dark Studio"}
        </span>
      )}
    </button>
  );
}
