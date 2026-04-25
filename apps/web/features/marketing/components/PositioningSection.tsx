import {
  IconCheckBox,
  IconCloseSquare,
  SectionHeader,
} from "@/features/marketing/components/icons";

export function PositioningSection() {
  return (
    <section className="mt-[140px] flex flex-col items-center gap-4">
      <SectionHeader num="01" label="Positioning" />
      <div className="w-full border-y border-white">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* What this is — white card */}
          <div className="relative flex h-full min-h-[560px] flex-col gap-3 overflow-hidden border-x border-white bg-white p-12">
            <h2 className="font-mono text-[36px] font-bold leading-none text-black">
              What this is
            </h2>
            <p className="font-mono text-base font-light leading-[1.4] text-black">
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
            <h3 className="font-mono text-2xl font-bold text-white">
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
              <li className="font-mono text-base font-light leading-[1.4] text-white">
                We don&apos;t soften this.
                <br />
                Onboarding is a filter, not a funnel.
              </li>
            </ul>
          </div>

          {/* Who this is for */}
          <div className="flex flex-col gap-9 border-x border-white p-12">
            <h3 className="font-mono text-2xl font-bold text-white">
              Who this is for
            </h3>
            <ul className="flex flex-col gap-4">
              {[
                "Experienced market participants leveling up their edge.",
                "Traders who need a second-opinion copilot for blind-spot coverage.",
                null,
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <IconCheckBox className="h-6 w-6 shrink-0 text-brand" />
                  {item ? (
                    <span className="font-mono text-base font-light leading-[1.4] text-white">
                      {item}
                    </span>
                  ) : (
                    <span className="font-mono text-base font-light leading-[1.4] text-white">
                      Anyone who wants to activate{" "}
                      <span className="text-brand">Six Eyes</span> on the
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
  );
}
