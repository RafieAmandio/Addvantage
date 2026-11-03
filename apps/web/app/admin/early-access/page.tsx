"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
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
  if (a.paymentAmount == null) return "n/a";
  return `${a.paymentAmount.toLocaleString()} ${a.paymentCurrency ?? ""}`.trim();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "n/a";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  draft: "text-white/40",
  pending: "text-brand",
  provisioned: "text-up",
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
      <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-white/40">
        Loading applications
      </div>
    );
  }

  const pendingCount = apps.filter((a) => a.status === "pending").length;
  const smallBtn =
    "inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:opacity-40";

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-[13px] text-down">
          {error}
        </p>
      )}

      {result && (
        <Panel
          title="Account provisioned"
          sub={
            result.emailSent ? (
              <span className="text-up">Email sent</span>
            ) : (
              <span className="text-down">Email not sent, copy the password below</span>
            )
          }
          action={
            <button onClick={() => setResult(null)} className={cn(smallBtn, "border border-white/[0.14] text-white hover:bg-raised")}>
              Dismiss
            </button>
          }
        >
          <dl className="grid gap-3 text-[14px] sm:grid-cols-2">
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Email</dt>
              <dd className="mt-1 break-all text-white">{result.email}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Temp password</dt>
              <dd className="mt-1 select-all break-all font-semibold text-brand">{result.tempPassword}</dd>
            </div>
          </dl>
        </Panel>
      )}

      <Panel
        title="Applications"
        sub={
          <>
            Review paid applicants, check their payment proof, then provision an account. This creates a VIP
            profile, emails a temporary password, and marks the applicant provisioned.
          </>
        }
        action={
          <div className="text-right">
            <div className="font-num text-[28px] font-semibold leading-none text-white">{pendingCount}</div>
            <div className="mt-1 text-[12px] text-white/40">pending of {apps.length}</div>
          </div>
        }
      >
        {apps.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-white/40">No applications yet</p>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] gap-4 border-b border-white/[0.07] pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 md:grid">
              <span>Applicant</span>
              <span>Payment</span>
              <span>Cashback</span>
              <span className="w-[270px] text-right">Action</span>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {apps.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "grid gap-2 py-3.5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] md:items-center md:gap-4",
                    a.status === "draft" && "opacity-50",
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-white">{a.email}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-[13px]">
                      <span className="text-white/55">@{a.telegramHandle}</span>
                      <span className={cn("capitalize", STATUS_STYLES[a.status] ?? "text-white/40")}>
                        {a.status}
                        {a.status === "provisioned" && a.provisionedAt ? ` ${fmtDate(a.provisionedAt)}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 text-[13px]">
                    <div className="text-white/80">
                      <span className="font-num text-[16px] font-semibold text-white">{fmtAmount(a)}</span>{" "}
                      <span className="text-white/55">{a.paymentMethod ? a.paymentMethod.toUpperCase() : ""}</span>
                    </div>
                    <div className="text-white/40">Applied {fmtDate(a.createdAt)}</div>
                  </div>

                  <div className="min-w-0 text-[13px] text-white/55">
                    <span className="md:hidden">Cashback: </span>
                    {a.wantsCashback ? "Yes" : a.wantsCashback === false ? "No" : "n/a"}
                    {a.broker ? <span className="text-white/40"> · {a.broker}</span> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:w-[270px] md:justify-end">
                    {a.proofImageUrl && (
                      <button
                        onClick={() => viewProof(a)}
                        disabled={proofBusyId === a.id}
                        className={cn(smallBtn, "border border-white/[0.14] text-white hover:bg-raised")}
                      >
                        {proofBusyId === a.id ? "Opening" : "View proof"}
                      </button>
                    )}
                    {a.status === "provisioned" ? (
                      <span className="text-[13px] font-medium text-up">Provisioned</span>
                    ) : (
                      <button
                        onClick={() => provision(a)}
                        disabled={busyId === a.id}
                        className={cn(smallBtn, "bg-brand text-black hover:opacity-90")}
                      >
                        {busyId === a.id ? "Provisioning" : "Provision + email"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
