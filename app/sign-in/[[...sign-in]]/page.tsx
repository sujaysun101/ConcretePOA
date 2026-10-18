import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";
import { AuthProvider } from "@/components/auth-provider";
import { clerkPublishableKey } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const publishableKey = clerkPublishableKey();
  return (
    <AuthProvider publishableKey={publishableKey}>
      <AuthScreen title="Sign in to the workspace that holds the file.">
        {publishableKey || process.env.NODE_ENV !== "production" ? (
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
        ) : (
          <p className="text-sm leading-relaxed">
            Clerk keys are not configured for this deployment. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or keep the existing VITE_CLERK_PUBLISHABLE_KEY) and CLERK_SECRET_KEY.
          </p>
        )}
      </AuthScreen>
    </AuthProvider>
  );
}
