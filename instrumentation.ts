export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionConfig, isProduction } = await import("@/lib/env");
    if (isProduction()) {
      validateProductionConfig();
    }
  }
}
