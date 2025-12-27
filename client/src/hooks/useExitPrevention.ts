import { useEffect } from "react";

export function useExitPrevention() {
  useEffect(() => {
    // Block F11 (fullscreen toggle)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F11 - fullscreen toggle
      if (e.key === "F11") {
        e.preventDefault();
        return false;
      }

      // Alt+F4 - close window
      if (e.altKey && e.key === "F4") {
        e.preventDefault();
        return false;
      }

      // ESC key
      if (e.key === "Escape") {
        e.preventDefault();
        return false;
      }

      // Alt+Tab - switch window
      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        return false;
      }

      // Windows/Meta key
      if (e.key === "Meta" || e.key === "Windows") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Alt+Delete
      if (e.ctrlKey && e.altKey && e.key === "Delete") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+Esc - Task Manager
      if (e.ctrlKey && e.shiftKey && e.key === "Escape") {
        e.preventDefault();
        return false;
      }

      // Alt+Space - Window menu
      if (e.altKey && e.key === " ") {
        e.preventDefault();
        return false;
      }

      // Ctrl+W - Close tab
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Q - Close browser (some browsers)
      if (e.ctrlKey && e.key === "q") {
        e.preventDefault();
        return false;
      }
    };

    // Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Block beforeunload (prevents closing tab/window)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return false;
    };

    // Block unload (backup for tab closing)
    const handleUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("beforeunload", handleBeforeUnload, true);
    window.addEventListener("unload", handleUnload, true);

    // Prevent dragging out of window
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === "A") {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("dragstart", handleDragStart, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("beforeunload", handleBeforeUnload, true);
      window.removeEventListener("unload", handleUnload, true);
      document.removeEventListener("dragstart", handleDragStart, true);
    };
  }, []);
}
