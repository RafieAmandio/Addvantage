import Link from "next/link";
import { ClassificationStripe } from "@/components/ui/Classification";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="grain min-h-screen bg-ink text-paper">
      <ClassificationStripe label="TRANSMISSION LOST // RESOURCE NOT FOUND" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-start px-6 py-32">
        <div className="absolute -right-32 top-12 h-[24rem] w-[24rem] rounded-full bg-amber/10 blur-[120px]" />
        <div className="absolute inset-0 bg-grid opacity-40" />

        <div className="relative">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
            STATUS · 404 · NULL TRANSMISSION
          </div>

          <div className="mt-6 font-display text-[14rem] font-medium leading-[0.8] tracking-tightest text-paper/15">
            404
          </div>

          <h1 className="mt-2 font-display text-6xl leading-[0.95] text-paper">
            That coordinate
            <br />
            <span className="italic text-amber">does not exist</span>
            <br />
            in the DOMAIN.
          </h1>

          <p className="mt-8 max-w-lg font-display text-xl text-paper/60">
            The surface you requested isn't transmitting. Either the path was
            wrong, the asset has been declassified and removed, or you've
            stumbled into restricted memory.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/">
              <Button size="lg">← RETURN TO BRIEF</Button>
            </Link>
            <Link href="/app">
              <Button variant="outline" size="lg">
                OPERATOR DASHBOARD
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-ink-3 pt-8 font-mono text-[10px] uppercase tracking-widest2 text-paper/40 sm:grid-cols-4">
            <div>
              <div className="text-amber">REQUEST</div>
              <div className="mt-1">UNKNOWN</div>
            </div>
            <div>
              <div className="text-amber">NODE</div>
              <div className="mt-1">04 / 11</div>
            </div>
            <div>
              <div className="text-amber">CHANNEL</div>
              <div className="mt-1">DOMAIN</div>
            </div>
            <div>
              <div className="text-amber">CODE</div>
              <div className="mt-1">404 · LOST</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
