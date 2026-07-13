import { SegmentedNav } from "@/components/ui/SegmentedNav";

const TABS = ["primers", "videos"] as const;
type Tab = (typeof TABS)[number];

const LABELS: Record<Tab, string> = {
  primers: "Primers",
  videos: "Video Modules",
};

const HREFS: Record<Tab, string> = {
  primers: "/app/education/primers",
  videos: "/app/education",
};

export function EducationTabs({ current }: { current: Tab }) {
  return (
    <SegmentedNav
      items={TABS}
      current={current}
      hrefFor={(t) => HREFS[t]}
      labelFor={(t) => LABELS[t]}
      ariaLabel="Education sections"
      className="mt-6"
    />
  );
}
