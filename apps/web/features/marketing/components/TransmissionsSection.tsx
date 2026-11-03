import { pillars } from "@/features/marketing/lib/data";
import { Frame } from "@/features/marketing/components/Frame";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";

// Kit spot icons (icons/48), one per pillar.
const ICON = ["news", "calendar", "todays-brief", "consultation", "education", "macro"];

/** The six pillars from the old page, copy unchanged. VIP+ ones arrive redacted and declassify as they land. */
export function TransmissionsSection() {
  return (
    <Frame id="transmissions" label="Transmissions" num="02" flip>
      {/* Phone: a snap carousel, one card and a bit of the next. Desktop: two rows of three filling the screen. */}
      <div className="flex snap-x snap-mandatory gap-px overflow-x-auto overscroll-x-contain bg-tv-stone [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible">
        {pillars.map((p, i) => (
          <article
            key={p.code}
            data-reveal
            style={{ ["--i" as string]: i }}
            className="tv-card flex w-[84%] shrink-0 snap-start flex-col gap-5 bg-tv-paper p-6 md:w-auto md:justify-center md:gap-6 md:p-10"
          >
            <div className="flex items-start justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/brand/icons/${ICON[i]}.svg`} alt="" width={56} height={56} className="tv-card-obj h-14 w-14" loading="lazy" />
              <span className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.08em]">
                <Scramble text={p.code} delay={100 + i * 90} className="text-tv-mute" />
                {p.locked ? (
                  <span className="flex items-center gap-1.5 rounded-[3px] bg-tv-ink px-1.5 py-0.5 font-medium text-tv-paper">
                    <svg viewBox="0 0 12 14" className="h-2.5 w-2.5" aria-hidden fill="currentColor">
                      <path d="M3 6V4a3 3 0 1 1 6 0v2h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1Zm1.5 0h3V4a1.5 1.5 0 0 0-3 0v2Z" />
                    </svg>
                    VIP+
                  </span>
                ) : (
                  <span className="rounded-[3px] border border-tv-ink px-1.5 py-0.5 font-medium">Free</span>
                )}
              </span>
            </div>
            <h3 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.015em]">{p.title}</h3>
            <p className="text-[16px] leading-[1.55] text-tv-graphite">
              <span className={p.locked ? "lv-redact" : undefined}>{p.desc}</span>
            </p>
          </article>
        ))}
      </div>
    </Frame>
  );
}
