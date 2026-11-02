import type { Metadata } from "next";
import { LabEntry } from "@/features/method/components/LabEntry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const flat = (s: string) => s.replace("/", "").toUpperCase();

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  return { title: `${flat(decodeURIComponent((await params).symbol))} · Chart Lab` };
}

export default async function LabSymbolPage({ params }: { params: Promise<{ symbol: string }> }) {
  return <LabEntry symbol={decodeURIComponent((await params).symbol)} />;
}
