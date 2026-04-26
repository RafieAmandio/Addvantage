import { AppStateProvider } from "@/lib/state";
import { ToastProvider } from "@/lib/toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Shortcuts } from "@/components/layout/Shortcuts";
import { SearchPalette } from "@/features/search/components/SearchPalette";
import { VisitTracker } from "@/components/layout/VisitTracker";
import { DocumentTitle } from "@/components/layout/DocumentTitle";
import { DemoBanner } from "@/components/layout/DemoBanner";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
      <ToastProvider>
        <DemoBanner />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-brand focus:bg-black focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest2 focus:text-brand"
        >
          Skip to content
        </a>
        <div className="flex min-h-screen bg-black text-white">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main id="main-content" className="min-w-0 flex-1">{children}</main>
          </div>
          <Shortcuts />
          <SearchPalette />
          <VisitTracker />
          <DocumentTitle />
        </div>
      </ToastProvider>
    </AppStateProvider>
  );
}
