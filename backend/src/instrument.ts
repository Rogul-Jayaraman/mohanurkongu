import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  enableLogs: process.env.NODE_ENV === "development",
  dataCollection: {
    // userInfo: false,
    // httpBodies: [],
  },
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  integrations: [Sentry.expressIntegration()],
});
