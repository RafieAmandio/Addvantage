"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE, getAccessToken } from "@/lib/api/client";
import { Panel } from "@/components/ui/Panel";

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
      <div className="space-y-4">
        <div className="h-48 max-w-2xl animate-pulse rounded-2xl bg-panel" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Panel
        className="max-w-2xl"
        title="Meet link"
        sub="meet.tradevantage.gg redirects here. Changes go live within a minute, no redeploy."
      >
        <label className="block">
          <span className="block text-[13px] font-medium text-white/70">Redirect target (Zoom URL)</span>
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSaved(false);
            }}
            placeholder="https://zoom.us/j/..."
            className="mt-2 h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={onSave}
            disabled={saving || !url.trim() || !dirty}
            className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {saving ? "Saving" : "Save"}
          </button>
          {saved && !dirty && <span className="text-[13px] text-up">Saved</span>}
          {error && <span className="text-[13px] text-down">{error}</span>}
        </div>

        {link && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-4 text-[13px] text-white/40">
            <span>Last updated {new Date(link.updatedAt).toLocaleString()}</span>
            <a
              href="https://meet.tradevantage.gg"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/[0.14] px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-raised"
            >
              Test meet.tradevantage.gg
            </a>
          </div>
        )}
      </Panel>
    </div>
  );
}
