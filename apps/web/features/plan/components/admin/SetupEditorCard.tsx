"use client";

import { cn } from "@/lib/cn";
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
