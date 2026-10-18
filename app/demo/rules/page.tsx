import type { Metadata } from "next";
import { RuleLibrary } from "@/components/rule-library";
import { builtinRules } from "@/lib/library";

export const metadata: Metadata = { title: "Rule library" };

export default function DemoRulesPage() {
  return <RuleLibrary rules={builtinRules()} canAdd={false} />;
}
