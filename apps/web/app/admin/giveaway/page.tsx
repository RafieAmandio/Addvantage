import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listGiveawayEntries, type GiveawayEntry } from "@/features/giveaway/admin/queries";
import { drawGiveawayWinner } from "@/features/giveaway/admin/actions";
import { formatDateTime } from "@/lib/cn";

export const metadata: Metadata = { title: "Giveaway" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function Row({ e }: { e: GiveawayEntry }) {
  return (
    <div className="grid grid-cols-[7rem_1fr_auto] items-center gap-4 border-b border-gray-3 bg-black px-4 py-3 sm:gap-6 sm:px-6">
      <span className="font-mono text-sm font-bold text-white">{e.bingxUid}</span>
      <span className="min-w-0 truncate font-mono text-xs text-white/60">{e.contact}</span>
      <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
        {e.wonAt ? (
          <span className="text-brand">★ Winner</span>
        ) : (
          formatDateTime(e.createdAt)
        )}
      </span>
    </div>
  );
}

export default async function AdminGiveawayPage() {
  await requireAdmin();
  const { entries, total } = await listGiveawayEntries();
  const winners = entries.filter((e) => e.wonAt);
  const eligible = entries.filter((e) => !e.wonAt);

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-white">
          Giveaway <span className="italic text-brand">entries</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            {total} entries · {winners.length} won
          </div>
          <form action={drawGiveawayWinner}>
            <button
              type="submit"
              disabled={eligible.length === 0}
              className="border border-brand bg-brand px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              🎲 Draw winner
            </button>
          </form>
        </div>
      </div>

      {winners.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">Winners</h2>
          <div className="border-t border-brand/30">
            {winners.map((e) => (
              <Row key={e.id} e={e} />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex min-h-[20vh] items-center justify-center border border-gray-3 bg-black font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          No entries yet
        </div>
      ) : (
        <div className="border-t border-gray-3">
          {entries.map((e) => (
            <Row key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  );
}
