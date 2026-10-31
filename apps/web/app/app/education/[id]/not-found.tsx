import Link from "next/link";

export default function PrimerNotFound() {
  return (
    <div className="px-4 pb-10 sm:px-6">
      <section className="mx-auto max-w-md rounded-2xl bg-panel p-8 text-center">
        <h1 className="font-num text-[30px] font-semibold leading-8 text-white">Primer not found</h1>
        <p className="mt-2 text-[15px] leading-[22px] text-white/55">
          This primer does not exist or may have been updated. Browse the library for current primers.
        </p>
        <Link
          href="/app/education/primers"
          className="mt-6 inline-flex rounded-full border border-white/[0.14] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-raised focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          ← Primer library
        </Link>
      </section>
    </div>
  );
}
