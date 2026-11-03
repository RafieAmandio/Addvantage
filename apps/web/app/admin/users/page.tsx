import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { apiGet } from "@/lib/api/client-server";
import { cn, formatDate } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";

const th = "pb-2 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

type User = {
  id: string;
  email: string;
  handle: string | null;
  tier: string;
  isAdmin: boolean;
  signedLiability: boolean;
  joinedAt: string;
  tradingLength: string | null;
  longestProfitable: string | null;
  markets: string[];
};

export default async function AdminUsersPage() {
  await requireAdmin();

  let users: User[] = [];
  try {
    users = (await apiGet<User[]>("/users/admin/all")) ?? [];
  } catch {
    users = [];
  }

  const vip = users.filter((u) => u.tier === "vip").length;
  const admins = users.filter((u) => u.isAdmin).length;

  return (
    <div className="space-y-4">
      <Panel
        title="Users"
        sub={`${users.length} registered, ${vip} VIP, ${admins} admin`}
      >
        {users.length === 0 ? (
          <div className="rounded-xl bg-raised px-5 py-12 text-center">
            <p className="text-[15px] font-medium text-white">No registered users yet.</p>
          </div>
        ) : (
          <table className="block w-full text-[14px] md:table">
            <thead className="hidden border-b border-white/[0.07] md:table-header-group">
              <tr>
                <th className={th}>User</th>
                <th className={th}>Tier</th>
                <th className={th}>Waiver</th>
                <th className={th}>Experience</th>
                <th className={th}>Markets</th>
                <th className={cn(th, "text-right")}>Joined</th>
              </tr>
            </thead>
            <tbody className="block divide-y divide-white/[0.07] md:table-row-group">
              {users.map((u) => (
                <tr key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 md:table-row md:py-0">
                  <td className="w-full min-w-0 md:w-auto md:py-3 md:pr-4">
                    <p className="truncate font-medium text-white">{u.email}</p>
                    <p className="text-[13px] text-white/40">{u.handle ? `@${u.handle}` : "No handle"}</p>
                  </td>
                  <td className="text-[13px] font-medium md:py-3 md:pr-4">
                    <span className={u.tier === "vip" ? "text-brand" : "text-white/55"}>{u.tier.toUpperCase()}</span>
                    {u.isAdmin && <span className="ml-2 text-white">Admin</span>}
                  </td>
                  <td className={cn("text-[13px] md:py-3 md:pr-4", u.signedLiability ? "text-white/55" : "text-down")}>
                    {u.signedLiability ? "Signed" : "Not signed"}
                  </td>
                  <td className="text-[13px] text-white/55 md:py-3 md:pr-4">
                    {u.tradingLength ?? <span className="text-white/25">Unknown</span>}
                    <span className="md:hidden"> exp</span>
                  </td>
                  <td className="w-full md:w-auto md:py-3 md:pr-4">
                    {u.markets.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {u.markets.map((m) => (
                          <span
                            key={m}
                            className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] font-medium text-white/60"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="hidden text-[13px] text-white/25 md:inline">None</span>
                    )}
                  </td>
                  <td className="text-[13px] text-white/40 md:whitespace-nowrap md:py-3 md:text-right">
                    <span className="md:hidden">Joined </span>
                    {formatDate(u.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
