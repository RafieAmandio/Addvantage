import type { Metadata } from "next";
import { LabEntry } from "@/features/method/components/LabEntry";

export const metadata: Metadata = { title: "Chart Lab" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LabPage() {
  return <LabEntry />;
}
