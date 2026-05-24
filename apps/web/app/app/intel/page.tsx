import type { Metadata } from "next";
import { IntelMapClient } from "@/features/intel/components/IntelMapClient";

export const metadata: Metadata = { title: "Intel Map" };
export const dynamic = "force-dynamic";

export default function IntelPage() {
  return <IntelMapClient />;
}
