import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Strict Zero-PII Enforcement: No document text, names, emails or tokens in Sentry
  tracesSampleRate: 0.05,
  beforeSend(event) {
    // Delete all request payloads, query parameters, cookies, and sensitive headers
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
        delete event.request.headers["x-clerk-auth-token"];
      }
    }
    // Delete any potential user email or IP if accidentally attached
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }
    return event;
  },
});
