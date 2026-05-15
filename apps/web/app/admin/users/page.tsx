import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { apiGet } from "@/lib/api/client-server";
import { formatDate } from "@/lib/cn";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

type User = {
  id: string;
  email: string;
  handle: string | null;
  tier: string;
  is_admin: boolean;
  signed_liability: boolean;
  joined_at: string;
  trading_length: string | null;
  longest_profitable: string | null;
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            Registry · Operators
          </span>
          <h1 className="mt-2 font-mono text-2xl font-bold text-white">
            {users.length} {users.length === 1 ? "Operator" : "Operators"}
          </h1>
        </div>
      </div>

      <div className="mt-8 h-px bg-white/20" />

      <div className="mt-px">
        {users.map((u, i) => (
          <div
            key={u.id}
            className="grid grid-cols-12 gap-4 border-b border-white/[0.08] py-5 sm:gap-6"
          >
            <div className="col-span-12 sm:col-span-4 lg:col-span-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tabular-nums text-white/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-mono text-sm text-white">{u.email}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest2 text-white/30">
                    {u.handle ? `@${u.handle}` : "no handle"}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 sm:col-span-8 lg:col-span-9">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`font-mono text-[9px] uppercase tracking-widest2 ${
                    u.tier === "vip" ? "text-brand" : "text-white/40"
                  }`}
                >
                  {u.tier}
                </span>
                {u.is_admin && (
                  <span className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
                    Admin
                  </span>
                )}
                <span className="text-white/10">·</span>
                <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                  {u.signed_liability ? "Liability signed" : "No waiver"}
                </span>
                <span className="text-white/10">·</span>
                <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                  {u.trading_length ?? "—"} exp
                </span>
                {u.markets.length > 0 && (
                  <>
                    <span className="text-white/10">·</span>
                    {u.markets.map((m) => (
                      <span
                        key={m}
                        className="border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/40"
                      >
                        {m}
                      </span>
                    ))}
                  </>
                )}
                <span className="text-white/10">·</span>
                <span className="font-mono text-[9px] text-white/20">
                  {formatDate(u.joined_at)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="py-20 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            No registered operators yet
          </div>
        </div>
      )}
    </div>
  );
}
