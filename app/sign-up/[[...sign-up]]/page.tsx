import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";
import { AuthProvider } from "@/components/auth-provider";
import { clerkPublishableKey } from "@/lib/config";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  const publishableKey = clerkPublishableKey();
  return (
    <AuthProvider publishableKey={publishableKey}>
      <AuthScreen title="Open a workspace before the next rejection letter arrives.">
        {publishableKey || process.env.NODE_ENV !== "production" ? (
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
        ) : (
          <p className="text-sm leading-relaxed">
            Clerk keys are not configured for this deployment. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or keep the existing VITE_CLERK_PUBLISHABLE_KEY) and CLERK_SECRET_KEY.
          </p>
        )}
      </AuthScreen>
    </AuthProvider>
  );
}
