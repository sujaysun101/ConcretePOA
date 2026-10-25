export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    const { validateProductionConfig, isProduction } = await import("@/lib/env");
    if (isProduction()) {
      validateProductionConfig();
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  err: { digest?: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
  context: { routerKind: "App Router" | "Pages Router"; routeType: "render" | "route" | "action" | "middleware" }
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(err, {
    extra: {
      routerKind: context.routerKind,
      routeType: context.routeType,
      path: request.path,
      method: request.method,
    },
  });
};
