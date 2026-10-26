"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export function AuthProvider({
  publishableKey,
  children,
}: {
  publishableKey?: string;
  children: React.ReactNode;
}) {
  const keyless = !publishableKey && process.env.NODE_ENV !== "production";
  if (!publishableKey && !keyless) return children;
  return (
    <ClerkProvider
      {...(publishableKey ? { publishableKey } : {})}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      {children}
    </ClerkProvider>
  );
}
