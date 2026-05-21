"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { API_BASE, getAccessToken } from "@/lib/api/client";
import { HASHTAGS } from "@tradevantage/shared";

const DIRECTIONS = ["long", "short"] as const;
const BIASES = ["bullish", "bearish", "neutral"] as const;

export interface SetupEntry {
  id: string;
  instrument: string;
  direction: "long" | "short";
  bias: "bullish" | "bearish" | "neutral";
  entry: string;
  stop: string;
  targets: string[];
  invalidation: string;
  rationale: string;
  confidence: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  imageUrl: string | null;
}

export function emptySetup(index: number): SetupEntry {
  return {
    id: `S-${String(index + 1).padStart(2, "0")}`,
    instrument: "",
    direction: "long",
    bias: "bullish",
    entry: "",
    stop: "",
    targets: [""],
    invalidation: "",
    rationale: "",
    confidence: 3,
    tags: [],
    imageUrl: null,
  };
}

export function SetupEditorCard({
  setup,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  setup: SetupEntry;
  index: number;
  onChange: (s: SetupEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const update = <K extends keyof SetupEntry>(key: K, val: SetupEntry[K]) =>
    onChange({ ...setup, [key]: val });

  const updateTarget = (i: number, val: string) => {
    const next = [...setup.targets];
    next[i] = val;
    onChange({ ...setup, targets: next });
  };

  const addTarget = () =>
    onChange({ ...setup, targets: [...setup.targets, ""] });

  const removeTarget = (i: number) => {
    const next = setup.targets.filter((_, idx) => idx !== i);
    onChange({ ...setup, targets: next.length === 0 ? [""] : next });
  };

  const toggleTag = (tag: string) => {
    const has = setup.tags.includes(tag);
    update("tags", has ? setup.tags.filter((t) => t !== tag) : [...setup.tags, tag]);
  };

  return (
    <div className="border border-gray-3 bg-gray-2/20 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          {setup.id}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="font-mono text-[9px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-blood-bright"
          >
            Remove
          </button>
        )}
      </div>

      <SetupImageUpload
        imageUrl={setup.imageUrl}
        onUploaded={(url) => update("imageUrl", url)}
        onRemoved={() => update("imageUrl", null)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Label text="Instrument">
          <input
            value={setup.instrument}
            onChange={(e) => update("instrument", e.target.value)}
            placeholder="EURUSD, ES1!, BBCA"
            className={INPUT}
          />
        </Label>
        <Label text="Direction">
          <select
            value={setup.direction}
            onChange={(e) => {
              const dir = e.target.value as "long" | "short";
              onChange({
                ...setup,
                direction: dir,
                bias: dir === "long" ? "bullish" : "bearish",
              });
            }}
            className={INPUT}
          >
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Label>
        <Label text="Bias">
          <select
            value={setup.bias}
            onChange={(e) => update("bias", e.target.value as SetupEntry["bias"])}
            className={INPUT}
          >
            {BIASES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Label text="Entry">
          <input
            value={setup.entry}
            onChange={(e) => update("entry", e.target.value)}
            placeholder="5,232 — 5,248 zone"
            className={INPUT}
          />
        </Label>
        <Label text="Stop">
          <input
            value={setup.stop}
            onChange={(e) => update("stop", e.target.value)}
            placeholder="Below 5,098"
            className={INPUT}
          />
        </Label>
      </div>

      <div className="mt-3">
        <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
          Targets
        </span>
        <div className="space-y-2">
          {setup.targets.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-white/30">
                T{i + 1}
              </span>
              <input
                value={t}
                onChange={(e) => updateTarget(i, e.target.value)}
                placeholder={`Target ${i + 1}`}
                className={cn(INPUT, "flex-1")}
              />
              {setup.targets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTarget(i)}
                  className="font-mono text-[9px] text-white/30 transition-colors hover:text-blood-bright"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTarget}
          className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand"
        >
          + target
        </button>
      </div>

      <Label text="Invalidation" className="mt-3">
        <textarea
          value={setup.invalidation}
          onChange={(e) => update("invalidation", e.target.value)}
          rows={2}
          placeholder="What kills this setup"
          className={cn(INPUT, "leading-relaxed")}
        />
      </Label>

      <Label text="Rationale" className="mt-3">
        <textarea
          value={setup.rationale}
          onChange={(e) => update("rationale", e.target.value)}
          rows={3}
          placeholder="Why this trade"
          className={cn(INPUT, "leading-relaxed")}
        />
      </Label>

      <div className="mt-3">
        <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
          Confidence
        </span>
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update("confidence", n)}
              className={cn(
                "h-5 w-8 border transition-colors",
                n <= setup.confidence
                  ? "border-brand bg-brand"
                  : "border-gray-3 bg-gray-2 hover:border-brand/40",
              )}
              aria-label={`Confidence ${n}`}
            />
          ))}
          <span className="ml-2 self-center font-mono text-[9px] text-white/40">
            {setup.confidence}/5
          </span>
        </div>
      </div>

      <div className="mt-3">
        <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
          Tags
        </span>
        <div className="flex flex-wrap gap-1">
          {HASHTAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
                setup.tags.includes(tag)
                  ? "border-brand bg-brand/20 text-brand"
                  : "border-gray-3 text-white/40 hover:border-brand/40",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupImageUpload({
  imageUrl,
  onUploaded,
  onRemoved,
}: {
  imageUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/plans/upload`, {
        method: "POST",
        headers,
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(body.message ?? `Upload failed (${res.status})`);
      }
      const json = await res.json();
      onUploaded(json.data?.imageUrl ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mb-4">
      <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
        Chart Image
      </span>
      {error && (
        <div className="mb-2 border border-blood bg-blood/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-blood-bright">
          {error}
        </div>
      )}
      {imageUrl && (
        <div className="mb-2">
          <a href={imageUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={imageUrl}
              alt="Setup chart"
              className="max-h-48 w-full rounded border border-gray-3 object-contain"
            />
          </a>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className="font-mono text-[9px] text-white/60 file:mr-2 file:border file:border-gray-3 file:bg-gray-2 file:px-2 file:py-1 file:font-mono file:text-[9px] file:uppercase file:tracking-widest2 file:text-white/60 file:transition-colors hover:file:border-brand hover:file:text-brand disabled:opacity-40"
        />
        {imageUrl && (
          <button
            type="button"
            onClick={onRemoved}
            disabled={uploading}
            className="border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-blood hover:text-blood-bright disabled:opacity-40"
          >
            {uploading ? "…" : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}

const INPUT =
  "w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:border-brand focus-visible:outline-none";

function Label({
  text,
  children,
  className,
}: {
  text: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
        {text}
      </span>
      {children}
    </label>
  );
}
