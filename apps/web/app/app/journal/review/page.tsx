import type { Metadata } from "next";
import { ReviewClient } from "@/features/journal/components/ReviewClient";

export const metadata: Metadata = { title: "Journal Review" };

export default function JournalReviewPage() {
  return <ReviewClient />;
}
