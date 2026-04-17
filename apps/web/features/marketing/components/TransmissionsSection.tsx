import { SectionHeader } from "@/features/marketing/components/icons";
import { pillars } from "@/features/marketing/lib/data";

export function TransmissionsSection() {
  return (
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
  );
}
