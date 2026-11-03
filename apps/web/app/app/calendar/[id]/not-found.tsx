import Link from "next/link";

export default function CalendarEventNotFound() {
  return (
    <div className="px-4 pb-10 sm:px-6">
      <div className="rounded-2xl bg-panel px-5 py-16 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Not found</p>
        <h1 className="mt-2 font-num text-[34px] font-semibold leading-[38px] text-white">This event is not on the calendar</h1>
        <p className="mt-2 text-[15px] text-white/55">It does not exist or has been removed.</p>
        <Link
          href="/app/calendar"
          className="mt-6 inline-flex rounded-full bg-brand px-4 py-2 text-[14px] font-medium text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          Back to calendar
        </Link>
      </div>
    </div>
  );
}
