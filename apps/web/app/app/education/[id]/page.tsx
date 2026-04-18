import { notFound } from "next/navigation";
import { listPublishedPrimers } from "@/features/education/queries/primers";
import { PrimerDetailView } from "@/features/education/components/PrimerDetailView";

export default async function PrimerPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  // One read of the full list — there are ~6 rows and we need prev/next
  // anchoring anyway. Cheaper than a second round-trip.
  const primers = await listPublishedPrimers();
  const idx = primers.findIndex((p) => p.id === id);
  const primer = idx >= 0 ? primers[idx] : null;

  if (!primer) return notFound();

  const prev = idx > 0 ? primers[idx - 1] : null;
  const next = idx < primers.length - 1 ? primers[idx + 1] : null;

  return (
    <PrimerDetailView
      primer={primer}
      prev={prev ? { id: prev.id, title: prev.title } : null}
      next={next ? { id: next.id, title: next.title } : null}
    />
  );
}
