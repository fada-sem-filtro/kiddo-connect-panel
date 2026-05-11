import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { ConsentChoices, ConsentRecord, DEFAULT_ACCEPTED, DEFAULT_REJECTED } from "./types";
import { loadConsent, saveConsent, clearConsent } from "./consentStorage";
import { applyConsent } from "./scriptLoader";

interface ConsentContextValue {
  consent: ConsentRecord | null;
  hasDecided: boolean;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  setChoices: (choices: ConsentChoices) => void;
  revoke: () => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(() => loadConsent());
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    if (consent) applyConsent(consent.choices);
  }, [consent]);

  const persist = useCallback((choices: ConsentChoices) => {
    const record = saveConsent(choices);
    setConsent(record);
    applyConsent(record.choices);
  }, []);

  const value = useMemo<ConsentContextValue>(() => ({
    consent,
    hasDecided: !!consent,
    preferencesOpen,
    openPreferences: () => setPreferencesOpen(true),
    closePreferences: () => setPreferencesOpen(false),
    acceptAll: () => { persist(DEFAULT_ACCEPTED); setPreferencesOpen(false); },
    rejectOptional: () => { persist(DEFAULT_REJECTED); setPreferencesOpen(false); },
    setChoices: (choices) => { persist(choices); setPreferencesOpen(false); },
    revoke: () => { clearConsent(); setConsent(null); },
  }), [consent, preferencesOpen, persist]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
