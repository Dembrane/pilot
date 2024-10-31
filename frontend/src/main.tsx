import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

import * as Sentry from "@sentry/react";
import {
  BUILD_VERSION,
  DISABLE_SENTRY,
  USE_PARTICIPANT_ROUTER,
} from "./config";

const sentryCommonOpts: Partial<Sentry.BrowserOptions> = {
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      autoInject: false,
      showBranding: false,
      colorScheme: "light",
      enableScreenshot: true,
      showName: false,
      isNameRequired: false,
      showEmail: true,
      isEmailRequired: true,
      triggerLabel: "Report an issue",
      triggerAriaLabel: "Report an issue",
      formTitle: "Report an issue",
      submitButtonLabel: "Submit",
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 0.5, //  Capture 50% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/(dashboard|portal|api|directus)(\.test)?\.dembrane\.com/,
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  release: BUILD_VERSION,
};

if (!DISABLE_SENTRY) {
  if (USE_PARTICIPANT_ROUTER) {
    Sentry.init({
      dsn: "https://27d974229a95ca3dcd9894f4073af1f1@o4507107162652672.ingest.de.sentry.io/4507107346743376",
      ...sentryCommonOpts,
    });
  } else {
    Sentry.init({
      dsn: "https://9194c7aa6556bcb82f8cb2aa417969cf@o4507107162652672.ingest.de.sentry.io/4507107165077584",
      ...sentryCommonOpts,
    });
  }
}

const root = document.getElementById("root");

if (root === null) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
