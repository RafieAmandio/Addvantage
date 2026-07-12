"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { API_BASE, getAccessToken } from "@/lib/api/client";

interface Application {
  id: string;
  email: string;
  telegramHandle: string;
  wantsCashback: boolean | null;
  broker: string | null;
  brokerAccountRef: string | null;
  paymentMethod: string | null;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  proofImageUrl: string | null;
  status: string;
  createdAt: string;
  provisionedAt: string | null;
  accountId: string | null;
}

interface ProvisionResult {
  accountId: string;
  email: string;
  tempPassword: string;
  emailSent: boolean;
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || `API ${res.status}`);
  }
  return json.data as T;
}

function fmtAmount(a: Application): string {
  if (a.paymentAmount == null) return "—";
  return `${a.paymentAmount.toLocaleString()} ${a.paymentCurrency ?? ""}`.trim();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  draft: "text-white/40",
  pending: "text-brand",
  provisioned: "text-moss",
};

export default function AdminEarlyAccessPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [proofBusyId, setProofBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ applications: Application[] }>("/early-access/admin/applications");
      setApps(data.applications ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function provision(app: Application) {
    if (
      !confirm(
        `Create an account for ${app.email} and email their login? This grants VIP access.`,
      )
    ) {
      return;
    }
    setBusyId(app.id);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch<ProvisionResult>(`/early-access/admin/${app.id}/provision`, {
        method: "POST",
      });
      setResult(res);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Provision failed");
    } finally {
      setBusyId(null);
    }
  }

  async function viewProof(app: Application) {
    setProofBusyId(app.id);
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>(`/early-access/admin/${app.id}/proof-url`);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load proof");
    } finally {
      setProofBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          ● Loading Applications
        </div>
      </div>
    );
  }

  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <div>
      <div>
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          Early Access · Provisioning
        </span>
        <h1 className="mt-2 font-mono text-2xl font-bold text-white">Applications</h1>
        <p className="mt-2 max-w-2xl font-mono text-sm font-light text-white/50">
          Review paid applicants, check their payment proof, then provision an account. This
          creates a VIP profile, emails a temporary password, and marks the applicant provisioned.
          {pendingCount > 0 && ` ${pendingCount} pending.`}
        </p>
      </div>

      {error && (
        <div className="mt-6 border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 border border-moss/50 bg-moss/10 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-moss">
            ● Account provisioned {result.emailSent ? "· email sent" : "· EMAIL NOT SENT (copy the password below)"}
          </div>
          <div className="mt-3 grid gap-2 font-mono text-sm text-white sm:grid-cols-2">
            <div>
              <span className="text-white/40">Email: </span>
              {result.email}
            </div>
            <div>
              <span className="text-white/40">Temp password: </span>
              <span className="select-all font-bold text-brand">{result.tempPassword}</span>
            </div>
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-4 border border-gray-3 px-3 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-8 h-px bg-white/20" />

      {apps.length === 0 ? (
        <div className="py-20 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            No applications yet
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-px bg-gray-3">
          {apps.map((a) => (
            <div
              key={a.id}
              className={cn(
                "grid grid-cols-12 gap-4 bg-black p-5 transition-colors hover:bg-gray-2",
                a.status === "draft" && "opacity-50",
              )}
            >
              <div className="col-span-12 md:col-span-4">
                <div className="font-display text-lg text-white">{a.email}</div>
                <div className="mt-0.5 font-mono text-[10px] text-white/40">
                  @{a.telegramHandle}
                </div>
                <div
                  className={cn(
                    "mt-1 font-mono text-[9px] uppercase tracking-widest2",
                    STATUS_STYLES[a.status] ?? "text-white/40",
                  )}
                >
                  ● {a.status}
                  {a.status === "provisioned" && a.provisionedAt
                    ? ` · ${fmtDate(a.provisionedAt)}`
                    : ""}
                </div>
              </div>

              <div className="col-span-12 md:col-span-4">
                <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                  Payment
                </div>
                <div className="mt-1 font-mono text-sm text-white/70">
                  {a.paymentMethod ? a.paymentMethod.toUpperCase() : "—"} · {fmtAmount(a)}
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                  Cashback: {a.wantsCashback ? "yes" : a.wantsCashback === false ? "no" : "—"}
                  {a.broker ? ` · ${a.broker}` : ""}
                </div>
                <div className="mt-1 font-mono text-[9px] text-white/30">
                  Applied {fmtDate(a.createdAt)}
                </div>
              </div>

              <div className="col-span-12 flex flex-wrap items-center gap-2 md:col-span-4 md:justify-end">
                {a.proofImageUrl && (
                  <button
                    onClick={() => viewProof(a)}
                    disabled={proofBusyId === a.id}
                    className="border border-gray-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50 transition-colors hover:border-brand hover:text-brand disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    {proofBusyId === a.id ? "Opening…" : "View proof"}
                  </button>
                )}
                {a.status === "provisioned" ? (
                  <span className="font-mono text-[9px] uppercase tracking-widest2 text-moss">
                    ✓ Provisioned
                  </span>
                ) : (
                  <button
                    onClick={() => provision(a)}
                    disabled={busyId === a.id}
                    className="bg-brand px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    {busyId === a.id ? "Provisioning…" : "Provision + email"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
