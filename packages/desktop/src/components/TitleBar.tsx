import { Minus, Square, X, Copy } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";

function getAppWindow() {
  return (window as any).__TAURI__?.window?.getCurrentWindow?.();
}

export function useIsTauri() {
  const [tauri, setTauri] = useState(false);
  useEffect(() => { setTauri(!!getAppWindow()); }, []);
  return tauri;
}

function useIsMacOS() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(
      navigator.platform.includes("Mac") ||
      navigator.userAgent.includes("Macintosh"),
    );
  }, []);
  return isMac;
}

export function TitleBar() {
  const isMac = useIsMacOS();
  const [isMaximized, setIsMaximized] = useState(false);

  const refreshMaximized = useCallback(async () => {
    try {
      const win = getAppWindow();
      if (win?.isMaximized) setIsMaximized(await win.isMaximized());
    } catch {}
  }, []);

  useEffect(() => {
    refreshMaximized();
    const interval = setInterval(refreshMaximized, 500);
    return () => clearInterval(interval);
  }, [refreshMaximized]);

  const minimize = useCallback(async () => {
    try { await getAppWindow()?.minimize?.(); } catch {}
  }, []);

  const toggleMaximize = useCallback(async () => {
    try { await getAppWindow()?.toggleMaximize?.(); } catch {}
  }, []);

  const close = useCallback(async () => {
    try { await getAppWindow()?.close?.(); } catch {}
  }, []);

  // macOS: native traffic lights, just a drag region
  if (isMac) {
    return (
      <div data-tauri-drag-region className="titlebar titlebar-mac">
        <span className="titlebar-title">Curium</span>
      </div>
    );
  }

  // Linux / Windows: custom window controls
  return (
    <div data-tauri-drag-region className="titlebar">
      <span className="titlebar-title">Curium</span>
      <div className="titlebar-controls">
        <button onClick={minimize} className="titlebar-btn" title="Minimize">
          <Minus size={14} />
        </button>
        <button onClick={toggleMaximize} className="titlebar-btn" title={isMaximized ? "Restore" : "Maximize"}>
          {isMaximized ? <Copy size={12} /> : <Square size={11} />}
        </button>
        <button onClick={close} className="titlebar-btn titlebar-btn-close" title="Close">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
