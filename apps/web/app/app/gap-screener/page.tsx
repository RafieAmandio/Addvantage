import type { Metadata } from "next";
import GapScreenerClient from "./GapScreenerClient";

export const metadata: Metadata = { title: "Gap Scanner" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function GapScreenerPage() {
  return <GapScreenerClient />;
}
