export const USE_PARTICIPANT_ROUTER =
  import.meta.env.VITE_USE_PARTICIPANT_ROUTER === "1";
export const PARTICIPANT_BASE_URL =
  import.meta.env.VITE_PARTICIPANT_BASE_URL ?? window.location.origin;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const SUPPORTED_LANGUAGES = ["en", "nl"] as const;
export const PRIVACY_POLICY_URL =
  "https://dembrane.notion.site/Privacy-statements-all-languages-fa97a183f9d841f7a1089079e77ffb52";
