import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/disclaimer", "/privacy", "/terms"]);

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY || undefined;
const secretKey = process.env.CLERK_SECRET_KEY || undefined;

export default clerkMiddleware(
  async (auth, request) => {
    const path = request.nextUrl.pathname;
    if (path.startsWith("/demo")) {
      if (process.env.DEMO_SCREENSHOT === "1") return NextResponse.next();
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isPublic(request)) return;
    if (path.startsWith("/api/")) {
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

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
