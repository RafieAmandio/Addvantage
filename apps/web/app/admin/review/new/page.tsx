import { requireAdmin } from "@/lib/auth/session";
import { NewsCreateForm } from "./NewsCreateForm";

export default async function AdminNewsNewPage() {
  await requireAdmin();
  return <NewsCreateForm />;
}
