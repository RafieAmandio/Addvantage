import type { Metadata } from "next";
import { LabEntry } from "@/features/method/components/LabEntry";
import { LabComingSoon } from "@/features/method/components/LabComingSoon";
import { isMockMode } from "@/lib/config/public";

export const metadata: Metadata = { title: "Chart Lab" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LabPage() {
  // ponytail: Chart Lab is demo-only until it ships; drop this line to open it in production.
  if (!isMockMode()) return <LabComingSoon />;
  return <LabEntry />;
}
