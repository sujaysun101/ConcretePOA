import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/disclaimer",
  "/privacy",
  "/terms",
  "/r/(.*)",
  "/api/health",
  "/api/cron/(.*)",
  "/api/webhooks/(.*)",
]);

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY || undefined;
const secretKey = process.env.CLERK_SECRET_KEY || undefined;

const clerk = clerkMiddleware(
  async (auth, request) => {
    if (isPublic(request)) return;

    const { userId, sessionClaims } = await auth();

    // Check API authentication
    if (request.nextUrl.pathname.startsWith("/api/")) {
      if (!userId) {
        return NextResponse.json({ error: "Sign in required.", code: "unauthenticated" }, { status: 401 });
      }
      if (request.nextUrl.pathname.startsWith("/api/admin")) {
        const claims = sessionClaims as Record<string, unknown> | undefined;
        const platformRole = (claims?.platformRole as string) ?? (claims?.metadata as Record<string, unknown>)?.platformRole;
        if (platformRole !== "admin") {
          return NextResponse.json({ error: "Platform administrator access required.", code: "forbidden" }, { status: 403 });
        }
      }
      return NextResponse.next();
    }

    // Platform admin route protection
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!userId) {
        await auth.protect();
      }
      const claims = sessionClaims as Record<string, unknown> | undefined;
      const platformRole = (claims?.platformRole as string) ?? (claims?.metadata as Record<string, unknown>)?.platformRole;
      if (platformRole !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.next();
    }

    await auth.protect();
  },
  {
    ...(publishableKey ? { publishableKey } : {}),
    ...(secretKey ? { secretKey } : {}),
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  },
);

// Node.js proxy (Next.js 16). Edge middleware bundles Clerk's #crypto and
// #safe-node-apis imports, which Vercel's Edge tracer rejects.
// The demo gate runs before Clerk so keyless dev (no publishable key) cannot skip it.
export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname.startsWith("/demo")) {
    if (process.env.VERCEL_ENV === "production") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (process.env.DEMO_SCREENSHOT === "1") return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }
  try {
    return await clerk(request, event);
  } catch (error) {
    console.error("Clerk proxy verification error, handling gracefully:", error);
    if (isPublic(request)) {
      const response = NextResponse.next();
      response.cookies.delete("__session");
      response.cookies.delete("__client_uat");
      return response;
    }
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in required.", code: "unauthenticated" }, { status: 401 });
    }
    const redirectRes = NextResponse.redirect(new URL("/sign-in", request.url));
    redirectRes.cookies.delete("__session");
    redirectRes.cookies.delete("__client_uat");
    return redirectRes;
  }
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
