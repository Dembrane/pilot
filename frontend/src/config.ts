export const USE_PARTICIPANT_ROUTER =
  import.meta.env.VITE_USE_PARTICIPANT_ROUTER === "1";
export const PARTICIPANT_BASE_URL =
  import.meta.env.VITE_PARTICIPANT_BASE_URL ?? window.location.origin;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
