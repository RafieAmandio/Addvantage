import Link from "next/link";

export default function TagNotFound() {
  return (
    <div className="px-4 pb-10 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl bg-panel p-8 text-center">
        <p className="text-[17px] font-medium text-white">Tag not found</p>
        <p className="mt-1 text-[14px] text-white/55">This tag does not exist in the taxonomy.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/app/tags" className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90">
            All tags
          </Link>
        </div>
      </div>
    </div>
  );
}
