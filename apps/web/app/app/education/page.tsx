import { listPublishedPrimers } from "@/features/education/queries/primers";
import { EducationLibraryView } from "@/features/education/components/EducationLibraryView";

export default async function EducationPage() {
  const primers = await listPublishedPrimers();
  return <EducationLibraryView primers={primers} />;
}
