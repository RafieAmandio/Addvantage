import Link from "next/link";
import { ClassificationStripe } from "@/components/ui/Classification";
import { MarketTicker } from "@/components/ui/Ticker";
import { Button } from "@/components/ui/Button";
import { SectionNumber, DataLabel } from "@/components/ui/Marker";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      <ClassificationStripe />
      <MarketTicker />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-ink-3">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-amber/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-amber-deep/20 blur-[140px]" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-20 lg:py-28">
          {/* Left rail — IDs and meta */}
          <aside className="col-span-12 space-y-4 lg:col-span-2">
            <DataLabel>Brief / 04.07.26</DataLabel>
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              <div>VOL · 04</div>
              <div>NO · 088</div>
              <div className="mt-3 flex items-center gap-2 text-moss">
                <span className="led" />
                LIVE
              </div>
            </div>
          </aside>

          {/* Center — title block */}
          <div className="col-span-12 stagger lg:col-span-8">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
              ANTS // ALPHA NETWORK TRADING SYSTEM
            </div>

            <h1 className="mt-6 font-display text-[clamp(3.5rem,9vw,8rem)] font-medium leading-[0.85] tracking-tightest text-paper">
              Welcome
              <br />
              to the
              <br />
              <span className="italic text-amber">DOMAIN.</span>
            </h1>

            <p className="mt-8 max-w-2xl font-display text-xl italic text-paper/70 lg:text-2xl">
              Directional Outlook & Macro Alpha Intelligence — a market radar
              powered by AI and professionals, built for traders who already
              know what they're doing.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/signup">
                <Button size="lg">REQUEST ACCESS →</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  OPERATOR LOGIN
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              <span>NO COMMUNITY</span>
              <span className="text-amber/40">/</span>
              <span>NO CHAT</span>
              <span className="text-amber/40">/</span>
              <span>NO CHARTS-BY-COMMITTEE</span>
              <span className="text-amber/40">/</span>
              <span>ONE-WAY TRANSMISSION</span>
            </div>
          </div>

          {/* Right rail */}
          <aside className="col-span-12 space-y-4 border-l border-amber/20 pl-6 lg:col-span-2">
            <DataLabel>Auth.By</DataLabel>
            <div className="font-mono text-xs text-paper/70">Anthony</div>
            <div className="font-mono text-[10px] text-paper/40">
              + desk operators
            </div>
            <div className="mt-6 border-t border-amber/20 pt-4">
              <DataLabel>Cadence</DataLabel>
              <div className="mt-1 font-mono text-xs text-paper/70">
                Continuous · 24h
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ─── 01 / WHO ─── */}
      <section className="border-b border-ink-3">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionNumber n="01 /" label="POSITIONING" />

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="font-display text-4xl leading-tight tracking-tightest text-paper">
                What this is.
              </h2>
              <p className="mt-6 font-display text-xl italic leading-relaxed text-paper/70">
                A market radar powered by AI and professionals, created for
                traders and investors who already know what they're doing.
              </p>
            </div>

            <div className="border-l border-amber/30 pl-8 lg:col-span-1">
              <DataLabel>Who this is NOT for.</DataLabel>
              <ul className="mt-6 space-y-4 font-display text-2xl text-paper/40">
                <li className="flex items-baseline gap-3">
                  <span className="font-mono text-amber">×</span>
                  <span className="line-through decoration-amber/40">
                    Beginners
                  </span>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="font-mono text-amber">×</span>
                  <span className="line-through decoration-amber/40">
                    Gamblers
                  </span>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="font-mono text-amber">×</span>
                  <span className="line-through decoration-amber/40">
                    Hobbyists
                  </span>
                </li>
              </ul>
              <p className="mt-8 font-mono text-[11px] uppercase tracking-widest2 text-paper/40">
                We don't soften this.<br />
                Onboarding is a filter, not a funnel.
              </p>
            </div>

            <div className="border-l border-amber/30 pl-8 lg:col-span-1">
              <DataLabel>Who this is FOR.</DataLabel>
              <ul className="mt-6 space-y-5 font-display text-xl text-paper">
                <li className="flex items-baseline gap-3">
                  <span className="font-mono text-amber">+</span>
                  <span>
                    Experienced market participants leveling up their edge.
                  </span>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="font-mono text-amber">+</span>
                  <span>
                    Traders who need a second-opinion copilot for blind-spot
                    coverage.
                  </span>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="font-mono text-amber">+</span>
                  <span>
                    Anyone who wants to activate{" "}
                    <em className="italic text-amber">Six Eyes</em> on the
                    market.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 02 / TRANSMISSIONS ─── */}
      <section className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionNumber n="02 /" label="TRANSMISSIONS" />

          <div className="mt-12 grid grid-cols-12 gap-px bg-ink-3">
            {pillars.map((p, i) => (
              <div
                key={p.code}
                className="col-span-12 bg-ink p-8 transition-colors hover:bg-ink-2 sm:col-span-6 lg:col-span-4"
              >
                <div className="flex items-start justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                    {p.code}
                  </div>
                  <div
                    className={
                      "font-mono text-[9px] uppercase tracking-widest2 " +
                      (p.locked ? "text-blood" : "text-moss")
                    }
                  >
                    {p.locked ? "● LOCKED" : "○ FREE"}
                  </div>
                </div>
                <h3 className="mt-6 font-display text-3xl leading-tight text-paper">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm text-paper/60">{p.desc}</p>
                <div className="mt-6 font-mono text-[10px] uppercase tracking-widest2 text-paper/30">
                  {String(i + 1).padStart(2, "0")} / {String(pillars.length).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 03 / FAQ ─── */}
      <section className="border-b border-ink-3">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionNumber n="03 /" label="FREQUENT INTERROGATIONS" />

          <div className="mt-12 grid grid-cols-12 gap-12">
            <div className="col-span-12 lg:col-span-4">
              <h2 className="font-display text-5xl italic leading-[0.95] text-paper">
                "Where's the Discord?"
              </h2>
              <p className="mt-6 font-display text-xl text-paper/60">
                Nowhere. Four reasons.
              </p>
            </div>

            <ol className="col-span-12 space-y-px bg-ink-3 lg:col-span-8">
              {faq.map((f, i) => (
                <li
                  key={f.q}
                  className="grid grid-cols-12 gap-6 bg-ink p-6 hover:bg-ink-2"
                >
                  <div className="col-span-12 sm:col-span-2">
                    <div className="font-mono text-3xl text-amber">
                      0{i + 1}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/30">
                      Reason
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-10">
                    <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                      {f.q}
                    </div>
                    <p className="mt-2 text-paper/80">{f.a}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─── 04 / PRICING ─── */}
      <section className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionNumber n="04 /" label="ACCESS" />

          <div className="mt-12 grid grid-cols-12 gap-6">
            <div className="col-span-12 border border-ink-3 bg-ink p-10 lg:col-span-6">
              <DataLabel>Tier 00 / Free</DataLabel>
              <div className="mt-4 font-display text-6xl text-paper">IDR 0</div>
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                · No commitment
              </div>
              <ul className="mt-8 space-y-2 text-sm text-paper/70">
                <li>· Unfiltered news + impact analysis</li>
                <li>· Economic calendar</li>
                <li>· My Channel (founder broadcast)</li>
                <li>· Public psychology primers</li>
              </ul>
            </div>

            <div className="relative col-span-12 border border-amber bg-ink p-10 lg:col-span-6 scanline">
              <div className="absolute -top-px right-0 bg-amber px-3 py-1 font-mono text-[9px] uppercase tracking-widest2 text-ink">
                Operator Tier
              </div>
              <DataLabel>Tier 01 / VIP+ Trader</DataLabel>
              <div className="mt-4 font-display text-6xl text-amber">
                IDR 4.5M
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/60">
                · Per quarter · 3-month commitment
              </div>
              <ul className="mt-8 space-y-2 text-sm text-paper">
                <li>+ Everything in Free</li>
                <li>+ Daily / weekly Trading Plan</li>
                <li>+ 1v1 Consultation (AI + team)</li>
                <li>+ Full Education library</li>
                <li>+ Hashtag explorer (full)</li>
                <li>+ All collab channels</li>
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button size="lg" className="w-full">
                  REQUEST ACCESS →
                </Button>
              </Link>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                Liability waiver required at signup. No exceptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-ink-2">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-12">
          <div className="col-span-12 lg:col-span-6">
            <div className="font-display text-3xl text-paper">ANTS</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              Alpha Network Trading System // DOMAIN
            </div>
            <p className="mt-6 max-w-md font-mono text-[10px] uppercase tracking-widest2 text-paper/30">
              ANTS is not investment advice. ANTS does not manage funds. ANTS
              accepts no liability for trading decisions made by recipients.
              Liability waiver enforced at signup.
            </p>
          </div>
          <div className="col-span-6 lg:col-span-3">
            <DataLabel>Surfaces</DataLabel>
            <ul className="mt-3 space-y-1 font-mono text-xs text-paper/60">
              <li>Telegram (free pillars)</li>
              <li>DOMAIN web (paid)</li>
              <li>1v1 Consult</li>
            </ul>
          </div>
          <div className="col-span-6 lg:col-span-3">
            <DataLabel>Operator</DataLabel>
            <ul className="mt-3 space-y-1 font-mono text-xs text-paper/60">
              <li>
                <Link href="/login" className="hover:text-amber">
                  Login →
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-amber">
                  Request access →
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ink-3 px-6 py-4 text-center font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
          ANTS // DOMAIN // v0.1 // RESTRICTED // 2026
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
    q: "REASON 01 / NOISE REDUCTION",
    a: "No herd mentality. No group-think distorting your read on the market. The minute a community forms, the average opinion becomes your opinion. We refuse to do that to you.",
  },
  {
    q: "REASON 02 / NO PAID MODERATORS",
    a: "AI moderation is still imperfect, and we refuse to charge users for a chat we cannot reliably regulate. If we can't do it well, we won't do it at all.",
  },
  {
    q: "REASON 03 / EMOTIONAL CONTAGION",
    a: "Other people's panic and euphoria are the single biggest leak in most traders' P&L. We will not pipe that into your screen.",
  },
  {
    q: "REASON 04 / PRIVACY & IP",
    a: "Trade discussions belong in closed 1v1 consultation, not in a public room where your edge becomes everyone's edge.",
  },
];
