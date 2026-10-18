import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/disclaimer", "/privacy", "/terms"]);

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY || undefined;
const secretKey = process.env.CLERK_SECRET_KEY || undefined;

const clerk = clerkMiddleware(
  async (auth, request) => {
    if (isPublic(request)) return;
    if (request.nextUrl.pathname.startsWith("/api/")) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
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
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname.startsWith("/demo")) {
    if (process.env.DEMO_SCREENSHOT === "1") return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }
  return clerk(request, event);
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
