import {
  CONSENT_STORAGE_KEY,
  CONSENT_TTL_MS,
  CONSENT_VERSION,
  ConsentChoices,
  ConsentRecord,
} from "./types";

export function loadConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (!parsed?.version || parsed.version !== CONSENT_VERSION) return null;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(choices: ConsentChoices): ConsentRecord {
  const now = new Date();
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    date: now.toISOString(),
    expiresAt: new Date(now.getTime() + CONSENT_TTL_MS).toISOString(),
    choices: { ...choices, necessary: true },
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch { /* noop */ }
  return record;
}

export function clearConsent() {
  try { window.localStorage.removeItem(CONSENT_STORAGE_KEY); } catch { /* noop */ }
}
