import type { Metadata } from "next";
import { listPublishedPrimers } from "@/features/education/queries/primers";

export const metadata: Metadata = { title: "Education" };
import { EducationLibraryView } from "@/features/education/components/EducationLibraryView";

export default async function EducationPage() {
  const primers = await listPublishedPrimers();
  return <EducationLibraryView primers={primers} />;
}
