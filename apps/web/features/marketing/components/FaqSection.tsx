import { SectionHeader } from "@/features/marketing/components/icons";
import { faq } from "@/features/marketing/lib/data";
import { cn } from "@/lib/cn";

export function FaqSection() {
  return (
    <section className="mt-[140px] flex flex-col items-center gap-4">
      <SectionHeader num="03" label="Frequent Interrogations" />
      <div className="w-full border-y border-white">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative overflow-hidden border-x border-white p-12">
            <div className="pointer-events-none absolute left-[-256px] top-[224px] h-[1073px] w-[1073px] blur-[2.5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/figma/discord.png"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative flex flex-col gap-2 text-white">
              <h2 className="font-mono text-[64px] font-bold leading-none">
                Where&apos;s the Discord?
              </h2>
              <p className="font-mono text-2xl leading-[1.4]">
                <span className="font-light">Nowhere. </span>
                <span className="font-bold">4 Reasons.</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col border-x border-white">
            {faq.map((f, i) => (
              <div
                key={f.q}
                className={cn(
                  "flex flex-col gap-2 p-12",
                  i < faq.length - 1 && "border-b border-white"
                )}
              >
                <p className="font-mono text-base font-light leading-[1.4] text-white">
                  Reason {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-mono text-2xl font-bold leading-[1.4] text-white">
                  {f.q}
                </h3>
                <p className="font-mono text-base font-light leading-[1.4] text-white">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
