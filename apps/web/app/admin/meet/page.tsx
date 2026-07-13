"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE, getAccessToken } from "@/lib/api/client";

interface MeetLink {
  slug: string;
  targetUrl: string;
  updatedAt: string;
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

export default function AdminMeetPage() {
  const [link, setLink] = useState<MeetLink | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const json = await apiFetch("/short-links/admin/meet");
      setLink(json.data ?? null);
      setUrl(json.data?.targetUrl ?? "");
    } catch {
      setLink(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = link ? url.trim() !== link.targetUrl : url.trim().length > 0;

  async function onSave() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const json = await apiFetch("/short-links/admin/meet", {
        method: "PUT",
        body: JSON.stringify({ targetUrl: trimmed }),
      });
      setLink(json.data ?? null);
      setUrl(json.data?.targetUrl ?? trimmed);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          ● Loading Meet Link
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          Shortlink · Redirect
        </span>
        <h1 className="mt-2 font-mono text-2xl font-bold text-white">Meet Link</h1>
        <p className="mt-2 max-w-2xl font-mono text-sm font-light text-white/50">
          <span className="text-white/70">meet.tradevantage.gg</span> redirects here. Changes go
          live within a minute, no redeploy.
        </p>
      </div>

      <div className="mt-8 h-px bg-white/20" />

      <div className="mt-6 max-w-2xl border border-brand/40 bg-black p-6">
        {error && (
          <div className="mb-4 border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
            {error}
          </div>
        )}

        <label className="block">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
            Redirect Target (Zoom URL)
          </span>
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSaved(false);
            }}
            placeholder="https://zoom.us/j/..."
            className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
          />
        </label>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saving || !url.trim() || !dirty}
            className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {saved && !dirty && (
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-moss">
              ● Saved
            </span>
          )}
        </div>

        {link && (
          <div className="mt-5 border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            <div>Last updated {new Date(link.updatedAt).toLocaleString()}</div>
            <a
              href="https://meet.tradevantage.gg"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-white/30 transition-colors hover:text-brand"
            >
              Test → meet.tradevantage.gg
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
