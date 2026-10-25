import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingView } from "./onboarding-view";
import { readSession } from "@/lib/session";

export const metadata: Metadata = { title: "Get Started — ConcretePOA" };

export default async function OnboardingPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");

  return <OnboardingView />;
}
