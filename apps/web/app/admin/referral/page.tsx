"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { API_BASE, getAccessToken } from "@/lib/api/client";

interface ReferralPartner {
  id: string;
  name: string;
  category: string;
  tagline: string;
  url: string;
  iconUrl: string | null;
  sortOrder: number;
  active: boolean;
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function uploadIcon(file: File): Promise<string> {
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${API_BASE}/referral/admin/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const json = await res.json();
  return json.data?.imageUrl;
}

export default function AdminReferralPage() {
  const [partners, setPartners] = useState<ReferralPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("crypto_exchange");
  const [tagline, setTagline] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const json = await apiFetch("/referral/admin/partners");
      setPartners(json.data ?? []);
    } catch {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setName("");
    setCategory("crypto_exchange");
    setTagline("");
    setUrl("");
    setIconUrl("");
    setSortOrder(0);
    setActive(true);
    setEditId(null);
    setShowForm(false);
    setSaveError(null);
  }

  function startEdit(p: ReferralPartner) {
    setName(p.name);
    setCategory(p.category);
    setTagline(p.tagline);
    setUrl(p.url);
    setIconUrl(p.iconUrl ?? "");
    setSortOrder(p.sortOrder);
    setActive(p.active);
    setEditId(p.id);
    setShowForm(true);
    setSaveError(null);
  }

  async function onSubmit() {
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    setSaveError(null);

    try {
      const payload = {
        name: name.trim(),
        category,
        tagline: tagline.trim(),
        url: url.trim(),
        iconUrl: iconUrl.trim() || null,
        sortOrder,
        active,
      };

      if (editId) {
        await apiFetch(`/referral/admin/partners/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/referral/admin/partners", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this partner?")) return;
    await apiFetch(`/referral/admin/partners/${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleActive(p: ReferralPartner) {
    await apiFetch(`/referral/admin/partners/${p.id}`, {
      method: "PUT",
      body: JSON.stringify({ active: !p.active }),
    });
    await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-white/40">
        Loading referral partners
      </div>
    );
  }

  const label = "mb-2 block text-[13px] font-medium text-white/70";
  const input =
    "h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";
  const smallBtn =
    "inline-flex h-8 items-center rounded-full border border-white/[0.14] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";
  const newBtn = (
    <button
      onClick={() => { resetForm(); setShowForm(true); }}
      className="inline-flex h-8 items-center rounded-full bg-brand px-3.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
    >
      New partner
    </button>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Panel
        title="Referral partners"
        sub="Trading platform referral links shown in the app sidebar."
        action={newBtn}
        className={cn(!showForm && "lg:col-span-2")}
      >
        {partners.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[15px] font-medium text-white">No partners yet</p>
            <p className="mt-1 text-[13px] text-white/55">Add your first referral partner.</p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_3rem_auto] gap-4 border-b border-white/[0.07] pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 md:grid">
              <span>Partner</span>
              <span>Tagline and link</span>
              <span className="text-right">Order</span>
              <span className="w-[210px] text-right">Actions</span>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {partners.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_3rem_auto] md:items-center md:gap-4",
                    !p.active && "opacity-50"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {p.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.iconUrl} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-lg" />
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-raised text-[12px] font-semibold text-white/60">
                        {p.name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-white">{p.name}</div>
                      <div className="text-[12px]">
                        <span className={p.active ? "text-up" : "text-white/40"}>{p.active ? "Active" : "Inactive"}</span>
                        <span className="text-white/40"> · {p.category === "crypto_exchange" ? "Crypto exchange" : "Broker"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] text-white/70">{p.tagline || "No tagline"}</div>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-[12px] text-white/40 transition-colors hover:text-white"
                    >
                      {p.url}
                    </a>
                  </div>
                  <div className="text-[13px] text-white/55 md:text-right">
                    <span className="md:hidden">Order </span>
                    <span className="font-num text-[16px] font-semibold text-white">{p.sortOrder}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:w-[210px] md:justify-end">
                    <button onClick={() => toggleActive(p)} className={smallBtn}>
                      {p.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => startEdit(p)} className={smallBtn}>
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-down transition-colors hover:bg-down/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      {showForm && (
        <aside className="order-first lg:sticky lg:top-4 lg:order-none lg:self-start">
          <Panel title={editId ? "Edit partner" : "New partner"}>
            {saveError && (
              <p role="alert" className="mb-4 text-[13px] text-down">
                {saveError}
              </p>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={label}>Name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bitget" className={input} />
                </label>
                <label className="block">
                  <span className={label}>Category</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
                    <option value="crypto_exchange">Crypto Exchange</option>
                    <option value="broker">Broker</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={label}>Referral URL</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.bitget.com/referral/..."
                  className={input}
                />
              </label>

              <label className="block">
                <span className={label}>Tagline</span>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Cashback fees 20%"
                  className={input}
                />
              </label>

              <div>
                <span className={label}>Icon</span>
                <div className="flex items-center gap-2">
                  {iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={iconUrl} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg" />
                  )}
                  <label className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-full border border-white/[0.14] px-4 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-within:ring-1 focus-within:ring-brand">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        setSaveError(null);
                        try {
                          const url = await uploadIcon(file);
                          setIconUrl(url);
                        } catch (err) {
                          setSaveError(err instanceof Error ? err.message : "Upload failed");
                        } finally {
                          setUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    {uploading ? "Uploading" : "Upload"}
                  </label>
                  <input
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="or paste URL"
                    className={cn(input, "min-w-0 flex-1")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 items-end gap-3">
                <label className="block">
                  <span className={label}>Sort order</span>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className={cn(input, "font-num text-[17px]")}
                  />
                </label>
                <label className="flex h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="text-[13px] text-white/70">Active in sidebar</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={onSubmit}
                disabled={saving || !name.trim() || !url.trim()}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              >
                {saving ? "Saving" : editId ? "Update" : "Create"}
              </button>
              <button
                onClick={resetForm}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/[0.14] px-6 text-[14px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                Cancel
              </button>
            </div>
          </Panel>
        </aside>
      )}
    </div>
  );
}
