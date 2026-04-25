import Link from "next/link";
import {
  ArrowUpPixel,
  SectionHeader,
} from "@/features/marketing/components/icons";

export function AccessSection() {
  return (
    <section className="mt-[140px] flex flex-col items-center gap-4">
      <SectionHeader num="04" label="Access" />
      <div className="w-full border-y border-paper">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Tier 00 — Free */}
          <div className="flex flex-col gap-6 border border-paper p-12">
            <div className="flex items-center justify-between font-mono text-base">
              <span className="font-light text-paper">Tier 00</span>
              <span className="font-bold text-lime">Free</span>
            </div>
            <p className="font-mono text-[64px] font-bold leading-[1.4] text-paper">
              IDR 0
            </p>
            <p className="font-mono text-base font-light leading-[1.4] text-paper">
              No Commitment
            </p>
            <ul className="ml-6 list-disc font-mono text-base font-light leading-[1.4] text-paper">
              <li>Unfiltered news + impact analysis</li>
              <li>Economic calendar</li>
              <li>My Channel (founder broadcast)</li>
              <li>Public psychology primers</li>
            </ul>
          </div>

          {/* Tier 01 — VIP+ Trader */}
          <div className="flex flex-col gap-6 bg-paper p-12 text-ink">
            <div className="flex items-center justify-between font-mono text-base">
              <span className="font-light">Tier 01</span>
              <span className="font-bold">VIP+ Trader</span>
            </div>
            <p className="font-mono text-[64px] font-bold leading-[1.4]">
              IDR 4.5M
            </p>
            <p className="font-mono text-base font-light leading-[1.4]">
              Per quarter · 3-month commitment
            </p>
            <ul className="ml-6 list-disc font-mono text-base font-light leading-[1.4]">
              <li>Everything in Free</li>
              <li>Daily / weekly Trading Plan</li>
              <li>1v1 Consultation (AI + team)</li>
              <li>Full Education library</li>
              <li>Hashtag explorer (full)</li>
              <li>All collab channels</li>
            </ul>
            <Link
              href="/signup"
              className="flex w-full items-center justify-center gap-4 bg-lime p-4 font-mono text-base font-bold text-ink transition-colors hover:bg-brand-dim"
            >
              Request Access
              <ArrowUpPixel className="h-4 w-4 rotate-90" />
            </Link>
            <p className="font-mono text-base font-light leading-[1.4]">
              Liability waiver required at signup.
              <br />
              No exceptions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
