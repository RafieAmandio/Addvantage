import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listGiveawayEntries, type GiveawayEntry } from "@/features/giveaway/admin/queries";
import { drawGiveawayWinner } from "@/features/giveaway/admin/actions";
import { formatDateTime } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";

export const metadata: Metadata = { title: "Giveaway" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function Row({ e }: { e: GiveawayEntry }) {
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-4 py-2.5">
      <span className="truncate font-num text-[16px] font-semibold text-white">{e.bingxUid}</span>
      <span className="min-w-0 truncate text-[13px] text-white/55">{e.contact}</span>
      <span className="text-right text-[12px] text-white/40">
        {e.wonAt ? <span className="font-medium text-brand">Winner</span> : formatDateTime(e.createdAt)}
      </span>
    </div>
  );
}

function Head() {
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] gap-4 border-b border-white/[0.07] pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
      <span>BingX UID</span>
      <span>Contact</span>
      <span className="text-right">Entered</span>
    </div>
  );
}

export default async function AdminGiveawayPage() {
  await requireAdmin();
  const { entries, total } = await listGiveawayEntries();
  const winners = entries.filter((e) => e.wonAt);
  const eligible = entries.filter((e) => !e.wonAt);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel title="Giveaway entries" sub="One entry per BingX UID.">
        {entries.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-white/40">No entries yet</p>
        ) : (
          <>
            <Head />
            <div className="divide-y divide-white/[0.07]">
              {entries.map((e) => (
                <Row key={e.id} e={e} />
              ))}
            </div>
          </>
        )}
      </Panel>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Draw">
          <dl className="grid grid-cols-3 gap-3">
            {[
              ["Entries", total],
              ["Eligible", eligible.length],
              ["Won", winners.length],
            ].map(([k, v]) => (
              <div key={k}>
                <dd className="font-num text-[28px] font-semibold leading-none text-white">{v}</dd>
                <dt className="mt-1 text-[12px] text-white/40">{k}</dt>
              </div>
            ))}
          </dl>
          <form action={drawGiveawayWinner} className="mt-5">
            <button
              type="submit"
              disabled={eligible.length === 0}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-[14px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Draw winner
            </button>
          </form>
        </Panel>

        {winners.length > 0 && (
          <Panel title="Winners">
            <div className="divide-y divide-white/[0.07]">
              {winners.map((e) => (
                <Row key={e.id} e={e} />
              ))}
            </div>
          </Panel>
        )}
      </aside>
    </div>
  );
}
