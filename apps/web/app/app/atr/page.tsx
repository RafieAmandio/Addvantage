import type { Metadata } from "next";
import AtrClient from "./AtrClient";

export const metadata: Metadata = { title: "ATR Daily Levels" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AtrPage() {
  return <AtrClient />;
}
