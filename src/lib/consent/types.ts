export type ConsentCategory =
  | "necessary"
  | "functional"
  | "analytics"
  | "marketing"
  | "personalization";

export interface ConsentChoices {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export interface ConsentRecord {
  version: string;
  date: string;       // ISO
  expiresAt: string;  // ISO
  choices: ConsentChoices;
}

export const CONSENT_VERSION = "1.0.0";
export const CONSENT_STORAGE_KEY = "agendafleur_consent";
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 meses

export const DEFAULT_REJECTED: ConsentChoices = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  personalization: false,
};

export const DEFAULT_ACCEPTED: ConsentChoices = {
  necessary: true,
  functional: true,
  analytics: true,
  marketing: true,
  personalization: true,
};
