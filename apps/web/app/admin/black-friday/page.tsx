"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { API_BASE, getAccessToken } from "@/lib/api/client";

interface Row {
  id: string;
  email: string;
  name: string;
  contact: string;
  biggestLossBucket: string | null;
  bingxUid: string | null;
  hasBingxProof: boolean;
  plan: string | null;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  hasPaymentProof: boolean;
  status: string;
  reviewNote: string | null;
  dinnerInvitedAt: string | null;
  createdAt: string;
}

interface Group {
  key: string;
  label: string;
  count: number;
  byPlan: { free: number; full: number };
  items: Row[];
}

interface Totals {
  applications: number;
  drafts: number;
  free: number;
  full: number;
  pending: number;
  approved: number;
  rejected: number;
  approvedFull: number;
  paidUsd: number;
  dinnerInvited: number;
  dinnerSeats: number;
}

interface ApproveResult {
  email: string;
  existingAccount: boolean;
  tier: string;
  tempPassword: string | null;
  emailSent: boolean;
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `API ${res.status}`);
  return json.data as T;
}

const APPROVED = new Set(["approved", "provisioned"]);
const STATUS_STYLES: Record<string, string> = {
  submitted: "text-brand",
  approved: "text-up",
  provisioned: "text-up",
  rejected: "text-down",
};
const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const applied = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
// Fixed columns so UID, plan and actions line up across every row and group.
const COLS = "lg:grid-cols-[minmax(0,1fr)_9rem_10rem_28rem]";
const smallBtn =
  "inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:opacity-40";
const lineBtn = cn(smallBtn, "border border-white/[0.14] text-white hover:bg-raised");

export default function AdminBlackFridayPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ApproveResult | null>(null);
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ groups: Group[]; totals: Totals }>("/black-friday/admin/applications");
      setGroups(data.groups);
      setTotals(data.totals);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const keep = (r: Row) =>
      (plan === "all" || r.plan === plan) &&
      (status === "all" || (status === "approved" ? APPROVED.has(r.status) : r.status === status)) &&
      (!needle || r.email.toLowerCase().includes(needle) || (r.bingxUid ?? "").includes(needle));
    return groups.map((g) => {
      const items = g.items.filter(keep);
      return { ...g, items, free: items.filter((r) => r.plan === "free").length, full: items.filter((r) => r.plan === "full").length };
    });
  }, [groups, plan, status, q]);

  async function act<T>(id: string, path: string, body?: unknown): Promise<T | null> {
    setBusy(id);
    setError(null);
    try {
      const res = await apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      await load();
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function approve(r: Row) {
    const what = r.plan === "full" ? "VIP+ for 365 days" : "a free crypto account";
    if (!confirm(`Approve ${r.email} and provision ${what}? New accounts get the credentials email.`)) return;
    setResult(null);
    const res = await act<ApproveResult>(r.id, `/black-friday/admin/${r.id}/approve`);
    if (res) setResult(res);
  }

  async function reject(r: Row) {
    const note = prompt(`Reject ${r.email}? Optional note for the desk (not sent to the applicant):`);
    if (note === null) return;
    await act(r.id, `/black-friday/admin/${r.id}/reject`, { note });
  }

  async function viewProof(r: Row, kind: "bingx" | "payment") {
    setBusy(`${r.id}:${kind}`);
    try {
      const { url } = await apiFetch<{ url: string }>(`/black-friday/admin/${r.id}/proof-url/${kind}`);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load proof");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-white/40">Loading applications</div>;
  }

  const seatsFull = !!totals && totals.dinnerInvited >= totals.dinnerSeats;
  const select = "h-9 rounded-full border border-white/[0.14] bg-black px-3 text-[13px] text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-[13px] text-down">
          {error}
        </p>
      )}

      {result && (
        <Panel
          title={result.existingAccount ? "Approved onto an existing account" : "Account provisioned"}
          sub={
            result.existingAccount ? (
              <span>Account is now {result.tier.toUpperCase()}. No credentials email, they already have a password.</span>
            ) : result.emailSent ? (
              <span className="text-up">Email sent</span>
            ) : (
              <span className="text-down">Email not sent, copy the password below</span>
            )
          }
          action={
            <button onClick={() => setResult(null)} className={lineBtn}>
              Dismiss
            </button>
          }
        >
          <dl className="grid gap-3 text-[14px] sm:grid-cols-2">
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Email</dt>
              <dd className="mt-1 break-all text-white">{result.email}</dd>
            </div>
            {result.tempPassword && (
              <div>
                <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Temp password</dt>
                <dd className="mt-1 select-all break-all font-semibold text-brand">{result.tempPassword}</dd>
              </div>
            )}
          </dl>
        </Panel>
      )}

      {totals && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["Applications", totals.applications, `${totals.drafts} unfinished drafts`],
              ["Free / Full", `${totals.free} / ${totals.full}`, "by plan"],
              ["Pending review", totals.pending, `${totals.rejected} rejected`],
              ["Approved", totals.approved, `${totals.approvedFull} Full`],
              ["Paid Full", usd(totals.paidUsd), "$500 x approved Full"],
              ["Dinner seats", `${totals.dinnerInvited} of ${totals.dinnerSeats}`, seatsFull ? "All seats taken" : "Picked by the desk"],
            ] as const
          ).map(([k, v, s]) => (
            <Panel key={k} as="div" className="p-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{k}</div>
              <div className="mt-1 font-num text-[28px] font-semibold leading-none text-white">{v}</div>
              <div className="mt-1 text-[12px] text-white/40">{s}</div>
            </Panel>
          ))}
        </div>
      )}

      <Panel
        title="Black Friday applications"
        sub="Grouped by biggest single loss, pending first then newest. Approve provisions the account: Full gets VIP+ for 365 days, Free gets the crypto tier."
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="bf-plan">Plan</label>
          <select id="bf-plan" value={plan} onChange={(e) => setPlan(e.target.value)} className={select}>
            <option value="all">All plans</option>
            <option value="free">Free</option>
            <option value="full">Full</option>
          </select>
          <label className="sr-only" htmlFor="bf-status">Status</label>
          <select id="bf-status" value={status} onChange={(e) => setStatus(e.target.value)} className={select}>
            <option value="all">All statuses</option>
            <option value="submitted">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <label className="sr-only" htmlFor="bf-q">Search</label>
          <input
            id="bf-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email or UID"
            className="h-9 min-w-0 flex-1 rounded-full border border-white/[0.14] bg-black px-4 text-[13px] text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand sm:max-w-[280px]"
          />
        </div>

        <div className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {visible.map((g) => {
            const open = !closed[g.key];
            return (
              <section key={g.key}>
                <button
                  onClick={() => setClosed((c) => ({ ...c, [g.key]: open }))}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="text-[15px] font-semibold text-white">{g.label}</span>
                    <span className="font-num text-[18px] font-semibold text-white">{g.items.length}</span>
                  </span>
                  <span className="flex items-center gap-3 text-[13px] text-white/55">
                    <span>
                      {g.free} Free · {g.full} Full
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={cn("transition-transform", open ? "rotate-0" : "-rotate-90")}>
                      <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                {open &&
                  (g.items.length === 0 ? (
                    <p className="pb-4 text-[13px] text-white/30">No applications in this range</p>
                  ) : (
                    <div className="divide-y divide-white/[0.05] pb-2">
                      <div className={cn("hidden pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 lg:grid lg:gap-4", COLS)}>
                        <span>Applicant</span>
                        <span>BingX UID</span>
                        <span>Plan and status</span>
                        <span className="text-right">Action</span>
                      </div>
                      {g.items.map((r) => {
                        const approved = APPROVED.has(r.status);
                        const invited = !!r.dinnerInvitedAt;
                        return (
                          <div key={r.id} className={cn("grid gap-2 py-3 lg:items-center lg:gap-4", COLS)}>
                            <div className="min-w-0">
                              <div className="truncate text-[14px] font-medium text-white">{r.name}</div>
                              <div className="truncate text-[13px] text-white/55">
                                {r.email} · {r.contact}
                              </div>
                            </div>
                            <div className="min-w-0 text-[13px]">
                              <div className="font-num text-[16px] font-semibold tabular-nums text-white">{r.bingxUid}</div>
                              <div className="text-white/40">Applied {applied(r.createdAt)}</div>
                            </div>
                            <div className="text-[13px]">
                              <span className={cn("font-medium", r.plan === "full" ? "text-white" : "text-white/55")}>{r.plan === "full" ? "Full $500" : "Free"}</span>{" "}
                              <span className={cn("capitalize", STATUS_STYLES[r.status] ?? "text-white/40")}>{r.status === "submitted" ? "pending" : r.status}</span>
                              {r.reviewNote && <div className="truncate text-white/40" title={r.reviewNote}>{r.reviewNote}</div>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                              {r.hasBingxProof && (
                                <button onClick={() => viewProof(r, "bingx")} disabled={busy === `${r.id}:bingx`} className={lineBtn}>
                                  BingX proof
                                </button>
                              )}
                              {r.hasPaymentProof && (
                                <button onClick={() => viewProof(r, "payment")} disabled={busy === `${r.id}:payment`} className={lineBtn}>
                                  Receipt
                                </button>
                              )}
                              {(r.status === "submitted" || r.status === "rejected") && (
                                <button onClick={() => approve(r)} disabled={busy === r.id} className={cn(smallBtn, "bg-brand text-black hover:opacity-90")}>
                                  {busy === r.id ? "Working" : "Approve + provision"}
                                </button>
                              )}
                              {r.status === "submitted" && (
                                <button onClick={() => reject(r)} disabled={busy === r.id} className={cn(smallBtn, "border border-down/40 text-down hover:bg-down/10")}>
                                  Reject
                                </button>
                              )}
                              {approved && r.plan === "full" && (
                                <button
                                  onClick={() => act(r.id, `/black-friday/admin/${r.id}/dinner`, { invited: !invited })}
                                  disabled={busy === r.id || (!invited && seatsFull)}
                                  aria-pressed={invited}
                                  title={!invited && seatsFull ? "All dinner seats are taken" : undefined}
                                  className={cn(smallBtn, invited ? "bg-white text-black hover:opacity-90" : "border border-white/[0.14] text-white hover:bg-raised")}
                                >
                                  {invited ? "Dinner invited" : "Invite to dinner"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </section>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
