import type { LinguiConfig } from "@lingui/conf";

const config: LinguiConfig = {
  locales: ["en-US", "nl-NL", "de-DE", "fr-FR", "es-ES"],
  sourceLocale: "en-US",
  fallbackLocales: {
    default: "en-US",
  },
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}",
      include: ["src"],
    },
  ],
};

export default config;
