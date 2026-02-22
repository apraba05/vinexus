"use client";
import { useEffect } from "react";

interface ShortcutHandlers {
  onDeploy?: () => void;
  onLogs?: () => void;
  onTerminal?: () => void;
  onSave?: () => void;
}

/**
 * Global keyboard shortcut handler.
 * - Ctrl+Shift+D: Deploy
 * - Ctrl+Shift+L: Logs panel
 * - Ctrl+Shift+T: Terminal panel
 * - Ctrl+S: Save (handled by Monaco, but we prevent default)
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.shiftKey) {
        switch (e.key.toUpperCase()) {
          case "D":
            e.preventDefault();
            handlers.onDeploy?.();
            break;
          case "L":
            e.preventDefault();
            handlers.onLogs?.();
            break;
          case "T":
            e.preventDefault();
            handlers.onTerminal?.();
            break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
