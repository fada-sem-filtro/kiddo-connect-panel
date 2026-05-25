import { useEffect, useState, useCallback } from "react";

const KEY = "fleur:sidebar-collapsed";
const EVT = "fleur:sidebar-collapsed-change";

function read(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

/**
 * Global preferência de sidebar minimizada (desktop).
 * Persistido em localStorage e sincronizado entre componentes via CustomEvent.
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState<boolean>(() => read());

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setCollapsedState(!!detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setCollapsedState(e.newValue === "1");
    };
    window.addEventListener(EVT, onChange as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, onChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setCollapsed = useCallback((v: boolean) => {
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
    setCollapsedState(v);
    window.dispatchEvent(new CustomEvent<boolean>(EVT, { detail: v }));
  }, []);

  const toggle = useCallback(() => setCollapsed(!read()), [setCollapsed]);

  return { collapsed, setCollapsed, toggle };
}
