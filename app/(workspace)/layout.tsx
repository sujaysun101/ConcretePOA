import type { ReactNode } from "react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { AuthProvider } from "@/components/auth-provider";
import { AppShell } from "@/components/shell";
import { clerkPublishableKey, dataMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const publishableKey = clerkPublishableKey();
  return (
    <AuthProvider publishableKey={publishableKey}>
      <AppShell
        dataMode={dataMode()}
        orgSlot={
          publishableKey || process.env.NODE_ENV !== "production" ? (
            <OrganizationSwitcher
              afterSelectPersonalUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              appearance={{ elements: { rootBox: "max-w-[220px]" } }}
            />
          ) : (
            <span className="text-sm text-muted-foreground">Workspace</span>
          )
        }
        userSlot={publishableKey || process.env.NODE_ENV !== "production" ? <UserButton /> : <span className="text-sm">Account</span>}
      >
        {children}
      </AppShell>
    </AuthProvider>
  );
}
