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
      <div className="min-h-screen bg-black text-white">
        <ClassificationStripe label="ACCESS CONTROL // AUTHENTICATION" />
        <header className="border-b border-gray-3 bg-gray-2/50">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link href="/" className="font-display text-2xl text-white hover:text-brand transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none">
              ANTS<span className="text-brand">.</span>
            </Link>
            <Link
              href="/"
              className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              ← Return to brief
            </Link>
          </div>
        </header>
        {children}
      </div>
    </AppStateProvider>
  );
}
