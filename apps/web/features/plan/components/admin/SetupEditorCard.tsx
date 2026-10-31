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
    <div className="rounded-xl bg-raised/60 p-4 ring-1 ring-white/[0.06]">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-num text-[18px] font-semibold text-white">
          {setup.id}
          {setup.instrument && <span className="ml-2 text-white/55">{setup.instrument.toUpperCase()}</span>}
          <span className={cn("ml-2 text-[14px] uppercase", setup.direction === "long" ? "text-up" : "text-down")}>
            {setup.direction}
          </span>
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full border border-white/[0.14] px-3 py-1 text-[12px] font-medium text-white/70 transition-colors hover:bg-raised hover:text-down"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Label text="Instrument">
          <input
            value={setup.instrument}
            onChange={(e) => update("instrument", e.target.value)}
            placeholder="EURUSD, ES1!, BBCA"
            className={cn(INPUT, "uppercase")}
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
            placeholder="5,232 to 5,248 zone"
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
        <span className={LABEL}>Targets</span>
        <div className="mt-2 space-y-2">
          {setup.targets.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 shrink-0 font-num text-[15px] font-semibold text-white/40">
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
                  aria-label={`Remove target ${i + 1}`}
                  className="h-8 w-8 shrink-0 rounded-full text-[15px] text-white/40 transition-colors hover:bg-raised hover:text-down"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addTarget} className={cn(SMALL_BTN, "mt-2")}>
          Add target
        </button>
      </div>

      <Label text="Invalidation" className="mt-3">
        <textarea
          value={setup.invalidation}
          onChange={(e) => update("invalidation", e.target.value)}
          rows={3}
          placeholder="What kills this setup"
          className={TEXTAREA}
        />
      </Label>

      <Label text="Rationale" className="mt-3">
        <textarea
          value={setup.rationale}
          onChange={(e) => update("rationale", e.target.value)}
          rows={4}
          placeholder="Why this trade"
          className={TEXTAREA}
        />
      </Label>

      <div className="mt-3">
        <span className={LABEL}>Confidence</span>
        <div className="mt-2 flex items-center gap-1.5">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update("confidence", n)}
              className={cn(
                "h-3.5 w-3.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white",
                n <= setup.confidence ? "bg-brand" : "bg-white/[0.12] hover:bg-white/25",
              )}
              aria-label={`Confidence ${n}`}
              aria-pressed={n <= setup.confidence}
            />
          ))}
          <span className="ml-2 font-num text-[16px] font-semibold text-white/70">
            {setup.confidence}/5
          </span>
        </div>
      </div>

      <div className="mt-3">
        <span className={LABEL}>Tags</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HASHTAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={setup.tags.includes(tag)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[12px] transition-colors",
                setup.tags.includes(tag)
                  ? "border-brand bg-brand text-black"
                  : "border-white/[0.12] text-white/60 hover:text-white",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <SetupImageUpload
        imageUrl={setup.imageUrl}
        onUploaded={(url) => update("imageUrl", url)}
        onRemoved={() => update("imageUrl", null)}
      />
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
    <div className="mt-4">
      <span className={LABEL}>Chart image</span>
      {error && <p className="mt-1 text-[13px] text-down">{error}</p>}
      {imageUrl && (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
          <img src={imageUrl} alt="Setup chart" className="max-h-48 w-full rounded-xl bg-black object-contain" />
        </a>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className={FILE_INPUT}
        />
        {imageUrl && (
          <button type="button" onClick={onRemoved} disabled={uploading} className={SMALL_BTN}>
            {uploading ? "Working" : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}

const INPUT =
  "mt-2 h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";

const TEXTAREA =
  "mt-2 w-full resize-y rounded-xl bg-raised px-4 py-3 text-[15px] leading-[22px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";

const LABEL = "block text-[13px] font-medium text-white/70";

const SMALL_BTN =
  "rounded-full border border-white/[0.14] px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-raised disabled:opacity-40";

const FILE_INPUT =
  "min-w-0 max-w-full text-[13px] text-white/55 file:mr-3 file:rounded-full file:border file:border-solid file:border-white/[0.14] file:bg-transparent file:px-3 file:py-1 file:text-[12px] file:font-medium file:text-white hover:file:bg-raised disabled:opacity-40";

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
      <span className={LABEL}>{text}</span>
      {children}
    </label>
  );
}
