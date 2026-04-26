import { SectionHeader } from "@/features/marketing/components/icons";
import { pillars } from "@/features/marketing/lib/data";
import { cn } from "@/lib/cn";

export function TransmissionsSection() {
  return (
    <section className="mt-[140px] flex flex-col items-center gap-4">
      <SectionHeader num="02" label="Transmissions" />
      <div className="w-full border-y border-white bg-gray-2">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {pillars.map((p, i) => {
            const col = i % 3;
            return (
              <div
                key={p.code}
                className={cn(
                  "flex flex-col gap-9 p-12",
                  col !== 1 && "border-x border-white",
                  i >= 3 && "md:border-t border-white"
                )}
              >
                <div className="flex items-center justify-between font-mono text-base">
                  <span className="font-light text-white">{p.code}</span>
                  <span
                    className={cn(
                      "font-bold",
                      p.locked ? "text-blood-bright" : "text-brand"
                    )}
                  >
                    {p.locked ? "Locked" : "Free"}
                  </span>
                </div>
                <h3 className="font-mono text-2xl font-bold text-white">
                  {p.title}
                </h3>
                <p className="font-mono text-base font-light leading-[1.4] text-white">
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
