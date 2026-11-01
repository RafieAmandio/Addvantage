import { cn } from "@/lib/cn";
import { pillars } from "@/features/marketing/lib/data";
import { Frame } from "@/features/marketing/components/Frame";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";

/** The six pillars from the old page, copy unchanged. VIP+ ones arrive redacted and declassify as they land. */
export function TransmissionsSection() {
  return (
    <Frame id="transmissions" label="Transmissions" num="02" flip>
      <div className="grid grid-cols-1 bg-white/[0.03] md:grid-cols-3">
        {pillars.map((p, i) => (
          <article
            key={p.code}
            data-reveal
            style={{ ["--i" as string]: i }}
            className={cn("group flex flex-col gap-5 p-6 md:gap-8 md:p-12", i > 0 && "border-t border-white/10", i % 3 === 1 && "md:border-x md:border-white/20", i < 3 && "md:border-t-0", i >= 3 && "md:border-t md:border-white/20")}
          >
            <div className="flex items-center justify-between font-mono text-base">
              <Scramble text={p.code} delay={100 + i * 90} className="font-light" />
              {p.locked ? (
                <span className="flex items-center gap-1.5 rounded-[3px] bg-brand px-2 py-0.5 text-[12px] font-bold text-black">
                  <svg viewBox="0 0 12 14" className="h-3 w-3" aria-hidden fill="currentColor">
                    <path d="M3 6V4a3 3 0 1 1 6 0v2h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1Zm1.5 0h3V4a1.5 1.5 0 0 0-3 0v2Z" />
                  </svg>
                  VIP+
                </span>
              ) : (
                <span className="font-bold text-brand">Free</span>
              )}
            </div>
            <h3 className="font-mono text-2xl font-bold">{p.title}</h3>
            <p className="font-mono text-base font-light leading-[1.5] text-white/85">
              <span className={p.locked ? "lv-redact" : undefined}>{p.desc}</span>
            </p>
          </article>
        ))}
      </div>
    </Frame>
  );
}
