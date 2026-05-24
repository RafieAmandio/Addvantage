"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          ● Loading Referral Partners
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            Affiliate · Trading Platforms
          </span>
          <h1 className="mt-2 font-mono text-2xl font-bold text-white">
            Referral Partners
          </h1>
          <p className="mt-2 max-w-2xl font-mono text-sm font-light text-white/50">
            Manage trading platform referral links displayed in the app sidebar.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          + New Partner
        </button>
      </div>

      <div className="mt-8 h-px bg-white/20" />

      {showForm && (
        <div className="mt-6 border border-brand/40 bg-black p-6">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            {editId ? "Edit Partner" : "New Partner"}
          </div>

          {saveError && (
            <div className="mb-4 border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
              {saveError}
            </div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bitget"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Category
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              >
                <option value="crypto_exchange">Crypto Exchange</option>
                <option value="broker">Broker</option>
              </select>
            </label>
          </div>

          <label className="mb-4 block">
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
              Referral URL
            </span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.bitget.com/referral/..."
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
            />
          </label>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Tagline
              </span>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Cashback fees 20%"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </label>
            <div className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Icon
              </span>
              <div className="flex items-center gap-3">
                {iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={iconUrl} alt="" width={32} height={32} className="shrink-0 rounded border border-gray-3" />
                )}
                <label className="flex cursor-pointer items-center gap-2 border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/50 transition-colors hover:border-brand hover:text-brand">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
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
                  {uploading ? "Uploading..." : "Upload"}
                </label>
                <span className="font-mono text-[9px] text-white/30">or</span>
                <input
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="Paste URL"
                  className="min-w-0 flex-1 border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Sort Order
              </span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="accent-brand"
              />
              <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/60">
                Active (visible in sidebar)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSubmit}
              disabled={saving || !name.trim() || !url.trim()}
              className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              {saving ? "Saving..." : editId ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {partners.length === 0 && !showForm && (
        <div className="py-20 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            No partners registered
          </div>
          <div className="mt-4 font-mono text-xl font-bold text-white">
            Add your first referral partner.
          </div>
        </div>
      )}

      <div className="mt-6 space-y-px bg-gray-3">
        {partners.map((p) => (
          <div
            key={p.id}
            className={cn(
              "grid grid-cols-12 gap-4 bg-black p-5 transition-colors hover:bg-gray-2",
              !p.active && "opacity-50"
            )}
          >
            <div className="col-span-12 md:col-span-3">
              <div className="flex items-center gap-3">
                {p.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.iconUrl} alt="" width={24} height={24} className="shrink-0 rounded" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-white/60">
                    {p.name.charAt(0)}
                  </span>
                )}
                <div>
                  <div className="font-display text-lg text-white">{p.name}</div>
                  <div className={cn(
                    "mt-0.5 font-mono text-[9px] uppercase tracking-widest2",
                    p.active ? "text-moss" : "text-white/40"
                  )}>
                    {p.active ? "● ACTIVE" : "○ INACTIVE"}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-5">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                {p.category === "crypto_exchange" ? "Crypto Exchange" : "Broker"}
              </div>
              <div className="mt-1 text-sm text-white/70">{p.tagline || "—"}</div>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block font-mono text-[9px] uppercase tracking-widest2 text-white/30 transition-colors hover:text-brand"
              >
                {p.url.length > 50 ? p.url.slice(0, 47) + "..." : p.url}
              </a>
            </div>
            <div className="col-span-12 md:col-span-1">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                Order
              </div>
              <div className="mt-1 font-mono text-sm text-white/70">{p.sortOrder}</div>
            </div>
            <div className="col-span-12 flex items-center gap-2 md:col-span-3 md:justify-end">
              <button
                onClick={() => toggleActive(p)}
                className="border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/50 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                {p.active ? "Disable" : "Enable"}
              </button>
              <button
                onClick={() => startEdit(p)}
                className="border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/50 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="border border-blood/40 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-blood-bright/60 transition-colors hover:bg-blood hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
