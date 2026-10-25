import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Strict Zero-PII Enforcement via beforeBreadcrumb and beforeSend
  tracesSampleRate: 0.1,
  // Only capture navigation breadcrumbs; strip sensitive query strings
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === "xhr" || breadcrumb.category === "fetch") {
      // Strip potential sensitive query parameters or payload URLs
      if (breadcrumb.data?.url) {
        try {
          const url = new URL(breadcrumb.data.url, "https://concretepoa.com");
          breadcrumb.data.url = url.pathname;
        } catch {
          // ignore parsing error
        }
      }
    }
    return breadcrumb;
  },
  beforeSend(event) {
    // Strip request body, query params, cookies
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
      }
    }
    return event;
  },
});
