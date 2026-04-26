import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { NewsCreateForm } from "./NewsCreateForm";

export const metadata: Metadata = { title: "New Item" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminNewsNewPage() {
  await requireAdmin();
  return <NewsCreateForm />;
}
