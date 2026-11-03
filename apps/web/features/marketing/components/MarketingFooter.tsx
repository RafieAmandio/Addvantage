import Link from "next/link";

/** The old footer's columns on Paper, then the "+ vantage" wordmark (the kit's outline, never live Futura) rising out of its baseline at a set size, not stretched edge to edge. */
export function MarketingFooter() {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-tv-stone bg-tv-paper text-tv-ink">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-start justify-between gap-10 px-4 py-14 sm:px-6 md:px-10 md:py-20">
        <div className="flex w-full flex-col gap-8 md:max-w-[360px]">
          <p className="text-[15px] leading-[1.5] text-tv-graphite">
            TradeVantage does not manage funds. TradeVantage accepts no liability for trading decisions made by recipients. Liability waiver enforced at signup. Prices on this page are real closes from a saved snapshot, shown as examples, not advice.
          </p>
        </div>
        <div className="flex w-full max-w-[227px] flex-col gap-4 text-[15px]">
          <p className="tv-eyebrow text-tv-mute">Surface</p>
          <p>Telegram (free pillars)</p>
          <p>Web app (paid)</p>
          <p>1v1 Consult</p>
          <p className="tv-eyebrow mt-4 text-tv-mute">Exchange partner</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/partners/bingx.svg" alt="BingX" width={83} height={24} className="tv-partner h-6 w-auto self-start" loading="lazy" />
        </div>
        <div className="flex w-full max-w-[227px] flex-col items-start gap-4 text-[15px]">
          <p className="tv-eyebrow text-tv-mute">Operator</p>
          <Link href="/login" className="tv-link">
            Log in
          </Link>
          <Link href="/signup" className="tv-link">
            Request access
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 md:px-10">
        <Link href="#top" aria-label="TradeVantage, back to top" className="block w-full max-w-[560px] select-none">
          <span data-reveal="letters" className="block overflow-hidden pb-[2%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wordmark-ink.svg" alt="" width={234} height={55} className="block h-auto w-full" loading="lazy" />
          </span>
        </Link>

        <div className="tv-eyebrow mt-3 flex flex-wrap justify-between gap-4 border-t border-tv-stone py-5 text-tv-mute">
          <span>© {new Date().getFullYear()} TradeVantage</span>
          <span>Times in WIB, UTC+7</span>
          <Link href="#top" className="tv-link">
            Back to top ↑
          </Link>
        </div>
      </div>
    </footer>
  );
}
