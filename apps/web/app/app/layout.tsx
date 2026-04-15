import { AppStateProvider } from "@/lib/state";
import { ToastProvider } from "@/lib/toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Shortcuts } from "@/components/layout/Shortcuts";
import { SearchPalette } from "@/components/layout/SearchPalette";
import { VisitTracker } from "@/components/layout/VisitTracker";
import { DocumentTitle } from "@/components/layout/DocumentTitle";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-ink text-paper">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="min-w-0 flex-1">{children}</main>
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
