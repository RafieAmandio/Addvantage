import Link from "next/link";
import { tickerItems } from "@/lib/mock/ticker";

const FUTURA = "'Futura', 'Inter', system-ui, sans-serif";

function LogoMark({ size = 30 }: { size?: number }) {
  const iconSize = Math.round(size * 0.53);
  return (
    <div
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.17) }}
      className="relative flex shrink-0 items-center justify-center bg-lime"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 15.3079 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.30986 0L10.463 11.2513L12.8758 5.99305H15.3079L10.4438 16L2.88743 0H5.30986Z"
          fill="#202832"
        />
        <path d="M0.787 2.494H11.287L10.5 4.594H0L0.787 2.494Z" fill="#202832" />
      </svg>
    </div>
  );
}

function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <div
      className="flex items-baseline gap-1 text-paper"
      style={{ fontFamily: FUTURA }}
    >
      <span className="font-bold" style={{ fontSize: size * 0.67 }}>
        +
      </span>
      <span className="font-medium" style={{ fontSize: size }}>
        vantage
      </span>
    </div>
  );
}

function TriangleDown({ className = "h-[10px] w-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 15.341 10.167" className={className} aria-hidden>
      <path d="M0 0H15.341L7.6705 10.167L0 0Z" fill="currentColor" />
    </svg>
  );
}

function TriangleUp({ className = "h-[10px] w-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 15.341 10.167" className={className} aria-hidden>
      <path d="M0 10.167H15.341L7.6705 0L0 10.167Z" fill="currentColor" />
    </svg>
  );
}

function IconCloseSquare({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 3C2.44772 3 2 3.44772 2 4V20C2 20.5523 2.44772 21 3 21H21C21.5523 21 22 20.5523 22 20V4C22 3.44772 21.5523 3 21 3H3ZM8.29289 8.29289C8.68342 7.90237 9.31658 7.90237 9.70711 8.29289L12 10.5858L14.2929 8.29289C14.6834 7.90237 15.3166 7.90237 15.7071 8.29289C16.0976 8.68342 16.0976 9.31658 15.7071 9.70711L13.4142 12L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L12 13.4142L9.70711 15.7071C9.31658 16.0976 8.68342 16.0976 8.29289 15.7071C7.90237 15.3166 7.90237 14.6834 8.29289 14.2929L10.5858 12L8.29289 9.70711C7.90237 9.31658 7.90237 8.68342 8.29289 8.29289Z" />
    </svg>
  );
}

function IconCheckBox({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5ZM17.2929 9.29289C17.6834 9.68342 17.6834 10.3166 17.2929 10.7071L11 17L6.70711 12.7071C6.31658 12.3166 6.31658 11.6834 6.70711 11.2929C7.09763 10.9024 7.7308 10.9024 8.12132 11.2929L11 14.1716L15.8787 9.29289C16.2692 8.90237 16.9024 8.90237 17.2929 9.29289Z" />
    </svg>
  );
}

function ArrowUpPixel({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M7 13V5.414L4.707 7.707L3.293 6.293L8 1.586L12.707 6.293L11.293 7.707L9 5.414V13H7Z" />
    </svg>
  );
}

function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex w-full items-center justify-between px-6 text-center font-mono text-base font-bold md:px-[140px]">
      <span className="text-lime">{num}</span>
      <span className="text-paper">{label}</span>
    </div>
  );
}

const heroTicker = [
  { sym: "BBNI", val: "4.320", chg: "-4.2%", dir: "down" as const },
  { sym: "BBCA", val: "6.500", chg: "-4.2%", dir: "down" as const },
  { sym: "BBRI", val: "3.110", chg: "-1.2%", dir: "down" as const },
  { sym: "WBSA", val: "456", chg: "-24.2%", dir: "up" as const },
  { sym: "TPIA", val: "2.123", chg: "-1.2%", dir: "down" as const },
  { sym: "DGWA", val: "806", chg: "-0.1%", dir: "down" as const },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      {/* ─── HERO ─── */}
      <section className="px-3 pt-3">
        <div className="relative h-[min(1024px,92vh)] min-h-[820px] overflow-hidden rounded-[32px] bg-[#1F1F1F]">
          {/* Top nav: Logo + Join */}
          <div className="relative z-20 flex items-center justify-between px-6 py-8 md:px-[140px] md:py-[50px]">
            <Link href="/" className="flex items-center gap-[7.78px]">
              <LogoMark size={30} />
              <Wordmark size={24} />
            </Link>
            <Link
              href="/signup"
              className="rounded-[10px] bg-lime px-4 py-2 font-mono text-base font-bold text-ink transition-colors hover:bg-lime-dim"
            >
              Join Now!
            </Link>
          </div>

          {/* Hero content — top-aligned */}
          <div className="relative z-20 mx-auto flex max-w-[1100px] flex-col items-center gap-12 px-6 pt-8 text-center md:pt-[80px]">
            <h1 className="font-sans leading-none text-paper">
              <span className="block text-[clamp(3rem,10vw,128px)] font-normal">
                WELCOME TO
              </span>
              <span className="block text-[clamp(3rem,10vw,128px)] font-bold">
                THE DOMAIN<span className="text-lime">.</span>
              </span>
            </h1>
            <p className="max-w-2xl font-mono text-base leading-[1.4] text-paper">
              Directional Outlook &amp; Macro Alpha Intelligence — a market
              radar powered by AI and professionals, built for traders who
              already know what they&apos;re doing.
            </p>
            <div className="flex w-full max-w-[675px] gap-6">
              <Link
                href="/signup"
                className="flex-1 rounded-[10px] bg-lime px-8 py-4 text-center font-mono text-base font-bold text-ink-2 transition-colors hover:bg-lime-dim"
              >
                Request Access
              </Link>
              <Link
                href="/login"
                className="flex-1 rounded-[10px] border border-lime bg-ink/80 px-8 py-4 text-center font-mono text-base font-bold text-lime backdrop-blur-[9.4px] transition-colors hover:bg-ink"
              >
                Operator Login
              </Link>
            </div>
          </div>

          {/* Earth backdrop — huge sphere rising from bottom, only top curve visible */}
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/figma/earth-1.png"
              alt=""
              className="absolute left-1/2 top-[30%] w-[2600px] max-w-none -translate-x-1/2 select-none"
            />
            {/* bottom fade so the ticker sits cleanly over the earth */}
            <div className="absolute inset-x-0 bottom-0 h-[220px] bg-gradient-to-t from-[#1F1F1F] via-[rgba(31,31,31,0.6)] to-transparent" />
          </div>

          {/* Bottom ticker — infinite marquee, left → right */}
          <div className="absolute inset-x-0 bottom-0 z-30 overflow-hidden py-[50px]">
            <div className="flex w-max animate-ticker gap-[50px] [animation-direction:reverse] will-change-transform">
              {[...heroTicker, ...heroTicker].map((t, i) => (
                <div
                  key={`${t.sym}-${i}`}
                  className="flex w-[220px] shrink-0 items-center justify-center gap-[11px] rounded-[10px] bg-white/10 p-4 backdrop-blur-[8.65px]"
                >
                  <span className="font-mono text-base font-bold text-paper">
                    {t.sym}
                  </span>
                  <span className="font-mono text-base text-paper">
                    {t.val}
                  </span>
                  {t.dir === "up" ? (
                    <TriangleUp className="h-[10px] w-[15px] text-lime" />
                  ) : (
                    <TriangleDown className="h-[10px] w-[15px] text-[#E03C3C]" />
                  )}
                  <span
                    className={
                      "font-mono text-base " +
                      (t.dir === "up" ? "text-lime" : "text-[#E03C3C]")
                    }
                  >
                    {t.chg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 01 / POSITIONING ─── */}
      <section className="mt-[140px] flex flex-col items-center gap-4">
        <SectionHeader num="01" label="Positioning" />
        <div className="w-full border-y border-paper">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* What this is — white card */}
            <div className="relative flex h-full min-h-[560px] flex-col gap-3 overflow-hidden border-x border-paper bg-paper p-12">
              <h2 className="font-mono text-[36px] font-bold leading-none text-ink">
                What this is
              </h2>
              <p className="font-mono text-base font-light leading-[1.4] text-ink">
                A market radar powered by AI and professionals, created for
                traders and investors who already know what they&apos;re doing.
              </p>
              <div className="pointer-events-none absolute left-1/2 top-[193px] h-[364px] w-[364px] -translate-x-1/2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/figma/what-this-is.png"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Who this is not for */}
            <div className="flex flex-col gap-9 p-12">
              <h3 className="font-mono text-2xl font-bold text-paper">
                Who this is not for
              </h3>
              <ul className="flex flex-col gap-4">
                {["Beginners", "Gamblers", "Hobbyists"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <IconCloseSquare className="h-6 w-6 shrink-0 text-[#E03C3C]" />
                    <span className="font-mono text-base font-light leading-[1.4] text-[#E03C3C] line-through">
                      {item}
                    </span>
                  </li>
                ))}
                <li className="font-mono text-base font-light leading-[1.4] text-paper">
                  We don&apos;t soften this.
                  <br />
                  Onboarding is a filter, not a funnel.
                </li>
              </ul>
            </div>

            {/* Who this is for */}
            <div className="flex flex-col gap-9 border-x border-paper p-12">
              <h3 className="font-mono text-2xl font-bold text-paper">
                Who this is for
              </h3>
              <ul className="flex flex-col gap-4">
                {[
                  "Experienced market participants leveling up their edge.",
                  "Traders who need a second-opinion copilot for blind-spot coverage.",
                  null,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <IconCheckBox className="h-6 w-6 shrink-0 text-lime" />
                    {item ? (
                      <span className="font-mono text-base font-light leading-[1.4] text-paper">
                        {item}
                      </span>
                    ) : (
                      <span className="font-mono text-base font-light leading-[1.4] text-paper">
                        Anyone who wants to activate{" "}
                        <span className="text-lime">Six Eyes</span> on the
                        market.
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 02 / TRANSMISSIONS ─── */}
      <section className="mt-[140px] flex flex-col items-center gap-4">
        <SectionHeader num="02" label="Transmissions" />
        <div className="w-full border-y border-paper bg-ink-2">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {pillars.map((p, i) => {
              // columns 1 and 3 on each row get left/right borders
              const col = i % 3;
              const borderX = col !== 1 ? "border-x border-paper" : "";
              const borderTop = i >= 3 ? "md:border-t border-paper" : "";
              return (
                <div
                  key={p.code}
                  className={`flex flex-col gap-9 p-12 ${borderX} ${borderTop}`}
                >
                  <div className="flex items-center justify-between font-mono text-base">
                    <span className="font-light text-paper">{p.code}</span>
                    <span
                      className={
                        "font-bold " +
                        (p.locked ? "text-[#E03C3C]" : "text-lime")
                      }
                    >
                      {p.locked ? "Locked" : "Free"}
                    </span>
                  </div>
                  <h3 className="font-mono text-2xl font-bold text-paper">
                    {p.title}
                  </h3>
                  <p className="font-mono text-base font-light leading-[1.4] text-paper">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 03 / FREQUENT INTERROGATIONS ─── */}
      <section className="mt-[140px] flex flex-col items-center gap-4">
        <SectionHeader num="03" label="Frequent Interrogations" />
        <div className="w-full border-y border-paper">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left — headline w/ discord */}
            <div className="relative overflow-hidden border-x border-paper p-12">
              <div className="pointer-events-none absolute left-[-256px] top-[224px] h-[1073px] w-[1073px] blur-[2.5px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/figma/discord.png"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="relative flex flex-col gap-2 text-paper">
                <h2 className="font-mono text-[64px] font-bold leading-none">
                  Where&apos;s the Discord?
                </h2>
                <p className="font-mono text-2xl leading-[1.4]">
                  <span className="font-light">Nowhere. </span>
                  <span className="font-bold">4 Reasons.</span>
                </p>
              </div>
            </div>

            {/* Right — 4 reasons stack */}
            <div className="flex flex-col border-x border-paper">
              {faq.map((f, i) => (
                <div
                  key={f.q}
                  className={
                    "flex flex-col gap-2 p-12" +
                    (i < faq.length - 1 ? " border-b border-paper" : "")
                  }
                >
                  <p className="font-mono text-base font-light leading-[1.4] text-paper">
                    Reason {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-mono text-2xl font-bold leading-[1.4] text-paper">
                    {f.q}
                  </h3>
                  <p className="font-mono text-base font-light leading-[1.4] text-paper">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 04 / ACCESS ─── */}
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
                className="flex w-full items-center justify-center gap-4 bg-lime p-4 font-mono text-base font-bold text-ink transition-colors hover:bg-lime-dim"
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

      {/* ─── FOOTER ─── */}
      <footer className="mt-[140px] flex flex-wrap items-start justify-between gap-10 bg-ink-2 p-12 md:p-[140px]">
        <div className="flex w-full max-w-[310px] flex-col gap-[42px]">
          <div className="flex items-center gap-3">
            <LogoMark size={45} />
            <Wordmark size={36} />
          </div>
          <p className="font-mono text-base font-light leading-[1.4] text-paper">
            +Vantage does not manage funds. ANTS accepts no liability for
            trading decisions made by recipients. Liability waiver enforced at
            signup.
          </p>
        </div>
        <div className="flex w-full max-w-[227px] flex-col gap-[17px] font-mono text-base text-paper">
          <p className="font-bold">Surface</p>
          <p>Telegram (free pillars)</p>
          <p>DOMAIN web (paid)</p>
          <p>1v1 Consult</p>
        </div>
        <div className="flex w-full max-w-[227px] flex-col gap-[17px] font-mono text-base text-paper">
          <p className="font-bold">Operator</p>
          <Link href="/login" className="hover:text-lime">
            Login
          </Link>
          <Link href="/signup" className="hover:text-lime">
            Request Access
          </Link>
        </div>
      </footer>
    </main>
  );
}

const pillars = [
  {
    code: "TX-01",
    title: "Unfiltered News + Impact",
    desc: "Raw market-moving news in real time. Each item annotated with what it actually means for price.",
    locked: false,
  },
  {
    code: "TX-02",
    title: "Economic Calendar",
    desc: "Curated calendar of high-impact events, central bank decisions, earnings, macro releases.",
    locked: false,
  },
  {
    code: "TX-03",
    title: "Trading Plan",
    desc: "Daily / weekly directional plan. Setups, levels, invalidation. Authored, not signaled.",
    locked: true,
  },
  {
    code: "TX-04",
    title: "1v1 Consultation",
    desc: "Private chat with the AI and the desk. Trade reviews, second opinions, blind-spot checks.",
    locked: true,
  },
  {
    code: "TX-05",
    title: "Education",
    desc: "Process, psychology, risk, system design. No price-action snake oil.",
    locked: false,
  },
  {
    code: "TX-06",
    title: "My Channel",
    desc: "Founder broadcast. Daily takes. Continuous market context. No filter, no replies.",
    locked: false,
  },
];

const faq = [
  {
    q: "Noise Reduction",
    a: "No herd mentality. No group-think distorting your read on the market. The minute a community forms, the average opinion becomes your opinion. We refuse to do that to you.",
  },
  {
    q: "No Paid Moderators",
    a: "AI moderation is still imperfect, and we refuse to charge users for a chat we cannot reliably regulate. If we can't do it well, we won't do it at all.",
  },
  {
    q: "Emotional Contagion",
    a: "Other people's panic and euphoria are the single biggest leak in most traders' P&L. We will not pipe that into your screen.",
  },
  {
    q: "Privacy & IP",
    a: "Trade discussions belong in closed 1v1 consultation, not in a public room where your edge becomes everyone's edge.",
  },
];
