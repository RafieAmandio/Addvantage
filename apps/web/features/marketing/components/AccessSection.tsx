import Link from "next/link";
import { Roll } from "@/features/marketing/components/Roll";
import { Build } from "@/features/marketing/components/iso/Build";
import { Tilt } from "@/features/marketing/components/iso/Inspect";

// Each line of the old two lists, and which tier carries it. VIP+ is everything in Free plus the rest.
const ROWS: [string, boolean][] = [
  ["Unfiltered news + impact analysis", true],
  ["Economic calendar", true],
  ["My Channel (founder broadcast)", true],
  ["Public psychology primers", true],
  ["Daily / weekly Trading Plan", false],
  ["1v1 Consultation (founders)", false],
  ["Full Education library", false],
  ["Hashtag explorer (full)", false],
  ["All collab channels", false],
];

/** Included: a filled Ink square. Not included: the hairline square, empty. */
const Mark = ({ on }: { on: boolean }) => (
  <span className="flex justify-center">
    <span aria-hidden className={on ? "h-2.5 w-2.5 bg-tv-ink" : "h-2.5 w-2.5 border border-tv-mute"} />
    <span className="sr-only">{on ? "Included" : "Not included"}</span>
  </span>
);

/**
 * The two tiers as one spec sheet: a comparison you read across, not two pricing cards. VIP+ is
 * the object on the desk, the kit's isometric member card.
 */
export function AccessSection() {
  const cell = "border-b border-tv-stone py-2 md:py-2.5";
  return (
    <section id="access" className="relative z-10 flex flex-col justify-center bg-tv-paper py-12 text-tv-ink md:min-h-[100svh] md:py-[clamp(3rem,7svh,4.5rem)]">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-y-10 px-4 sm:px-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-x-16 md:px-10">
        <div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[clamp(2.4rem,4.6vw,4rem)] font-semibold leading-[0.98] tracking-[-0.035em]">Access</h2>
            {/* Phone: the card sits beside the heading instead of taking a screen of its own. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vip-card.svg" alt="" width={390} height={237} className="-mb-2 h-auto w-[150px] md:hidden" loading="lazy" />
          </div>
          <table className="mt-6 w-full border-collapse text-left text-[14px] leading-[1.3] md:mt-8 md:text-[16px] md:leading-[1.35]">
            <caption className="sr-only">Free and VIP+ Trader compared</caption>
            <colgroup>
              <col />
              <col className="w-[18%] md:w-[24%]" />
              <col className="w-[38%] md:w-[30%]" />
            </colgroup>
            <thead>
              <tr className="border-y border-tv-ink align-bottom">
                <th scope="col" className="py-3 pr-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-tv-mute">
                  Tier
                </th>
                <th scope="col" className="px-2 py-3 text-center">
                  <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-tv-mute">00</span>
                  <span className="mt-1 block font-semibold">Free</span>
                </th>
                <th scope="col" className="px-2 py-3 text-center">
                  <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-tv-mute">01</span>
                  <span className="mt-1 block font-semibold">VIP+ Trader</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <th scope="row" className={`${cell} pr-3 font-normal text-tv-graphite`}>
                  Price
                </th>
                <td className={`${cell} px-2 text-center`}>
                  <span className="block font-mono text-[14px] font-medium tabular-nums md:text-[clamp(1.1rem,1.9vw,1.6rem)]">IDR 0</span>
                  <span className="mt-1 block text-[12px] text-tv-mute md:text-[13px]">No commitment</span>
                </td>
                <td className={`${cell} px-2 text-center`}>
                  <span className="block whitespace-nowrap font-mono text-[14px] font-medium tabular-nums md:text-[clamp(1.1rem,1.9vw,1.6rem)]">IDR 18.000.000</span>
                  <span className="mt-1 block text-[12px] text-tv-mute md:text-[13px]">Per year · Annual commitment</span>
                </td>
              </tr>
              {ROWS.map(([x, free]) => (
                <tr key={x}>
                  <th scope="row" className={`${cell} pr-3 font-normal`}>
                    {x}
                  </th>
                  <td className={cell}>
                    <Mark on={free} />
                  </td>
                  <td className={cell}>
                    <Mark on />
                  </td>
                </tr>
              ))}
              <tr className="hidden md:table-row">
                <td className="pr-3 pt-4 align-top text-[13px] text-tv-mute">VIP+ carries everything in Free.</td>
                <td className="px-1 pt-4 align-top">
                  <Link href="/signup" className="tv-btn tv-btn-line tv-btn-sm w-full">
                    <Roll label="Start free" />
                  </Link>
                </td>
                <td className="px-1 pt-4 align-top">
                  <Link href="/signup" className="tv-btn tv-btn-ink tv-btn-sm w-full">
                    <Roll label="Request access" />
                    <span aria-hidden className="tv-arrow">
                      →
                    </span>
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
          {/* Phone: the two asks stacked under the sheet, full width. */}
          <div className="mt-5 flex flex-col gap-3 md:hidden">
            <p className="text-[13px] text-tv-mute">VIP+ carries everything in Free.</p>
            <Link href="/signup" className="tv-btn tv-btn-ink w-full">
              <Roll label="Request access" />
              <span aria-hidden className="tv-arrow">
                →
              </span>
            </Link>
            <Link href="/signup" className="tv-btn tv-btn-line w-full">
              <Roll label="Start free" />
            </Link>
          </div>
        </div>

        <figure className="flex flex-col">
          <Build className="mx-auto hidden w-full max-w-[520px] md:block">
            <div data-build="" data-dx="-60" data-dy="34" data-fade="" data-at="150">
              <Tilt>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/vip-card.svg" alt="The VIP+ member card, drawn on the desk" width={390} height={237} className="h-auto w-full" loading="lazy" />
              </Tilt>
            </div>
          </Build>
          <figcaption className="flex flex-col gap-4 md:mt-8 border-t border-tv-ink pt-4 text-[15px] leading-[1.45]">
            <span>
              Liability waiver required at signup.
              <br />
              No exceptions.
            </span>
            <Link href="/faq" className="tv-link self-start text-tv-graphite">
              Questions? Read the FAQ
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
