import { AppStateProvider } from "@/lib/state";
import { ClassificationStripe } from "@/components/ui/Classification";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
      <div className="min-h-screen bg-ink text-paper">
        <ClassificationStripe label="ACCESS CONTROL // AUTHENTICATION" />
        <header className="border-b border-ink-3 bg-ink-2/50">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link href="/" className="font-display text-2xl text-paper">
              ANTS<span className="text-lime">.</span>
            </Link>
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              ← Return to brief
            </div>
          </div>
        </header>
        {children}
      </div>
    </AppStateProvider>
  );
}
