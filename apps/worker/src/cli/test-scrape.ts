/**
 * Scraping smoke test. Runs each adapter's fetch() in isolation (no Supabase,
 * no persist), optionally runs the first candidate of each through the OpenAI
 * rephrase pipeline, and prints a summary table.
 *
 * Usage:
 *   pnpm --filter @tradevantage/worker exec tsx src/cli/test-scrape.ts
 *   pnpm --filter @tradevantage/worker exec tsx src/cli/test-scrape.ts --rephrase
 *   pnpm --filter @tradevantage/worker exec tsx src/cli/test-scrape.ts --only FRED,SC
 */
import { ADAPTERS } from "../adapters";
import type { Candidate, SourceAdapter } from "../adapters/base";
import { logger } from "../lib/logger";
import { rephrase } from "../pipeline/rephrase";

interface Result {
  code: string;
  ok: boolean;
  count: number;
  sample?: string;
  error?: string;
  rephrased?: { headline: string; impact: string; bias: string; tags: string[] };
}

async function runOne(adapter: SourceAdapter, doRephrase: boolean): Promise<Result> {
  const t0 = Date.now();
  try {
    const candidates: Candidate[] = await adapter.fetch({
      logger,
      existingHashes: new Set(),
    });
    const ms = Date.now() - t0;
    const result: Result = {
      code: adapter.code,
      ok: true,
      count: candidates.length,
      sample: candidates[0]?.rawText?.slice(0, 120),
    };
    console.log(
      `  ${adapter.code.padEnd(6)} ${String(candidates.length).padStart(3)} candidates  ${String(ms).padStart(5)}ms`
    );
    if (candidates[0]) {
      const preview = candidates[0].rawText.replace(/\s+/g, " ").slice(0, 140);
      console.log(`         └─ first: ${preview}${preview.length >= 140 ? "…" : ""}`);
    }
    if (doRephrase && candidates[0]) {
      try {
        const out = await rephrase(
          adapter.code,
          candidates[0].rawText,
          candidates[0].meta
        );
        const r = out.output;
        result.rephrased = {
          headline: r.headline,
          impact: r.impact,
          bias: r.bias,
          tags: r.tags,
        };
        console.log(`         └─ rephrased: ${r.headline}`);
        console.log(
          `         └─ impact=${r.impact} bias=${r.bias} tags=[${r.tags.join(", ")}] affects=[${r.affects.join(", ")}]`
        );
      } catch (err) {
        console.log(`         └─ rephrase FAILED: ${String(err)}`);
        result.rephrased = undefined;
      }
    }
    return result;
  } catch (err) {
    console.log(`  ${adapter.code.padEnd(6)} ERROR ${String(err)}`);
    return { code: adapter.code, ok: false, count: 0, error: String(err) };
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const doRephrase = args.has("--rephrase");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg
    ? onlyArg.slice("--only=".length).split(",").map((s) => s.toUpperCase())
    : null;

  const adapters = only
    ? ADAPTERS.filter((a) => only.includes(a.code))
    : ADAPTERS;

  console.log(`\n=== scrape smoke test ===`);
  console.log(
    `adapters: ${adapters.map((a) => a.code).join(", ")}${
      doRephrase ? "   (+ openai rephrase on first candidate)" : ""
    }\n`
  );

  const results: Result[] = [];
  for (const a of adapters) {
    const r = await runOne(a, doRephrase);
    results.push(r);
  }

  console.log(`\n=== summary ===`);
  const ok = results.filter((r) => r.ok).length;
  const total = results.length;
  const totalCandidates = results.reduce((acc, r) => acc + r.count, 0);
  console.log(`  ${ok}/${total} adapters ok  ·  ${totalCandidates} total candidates`);
  for (const r of results) {
    const status = r.ok ? "✓" : "✗";
    console.log(
      `  ${status} ${r.code.padEnd(6)} ${String(r.count).padStart(3)} candidates${
        r.rephrased ? "  [rephrase ok]" : ""
      }${r.error ? `  ${r.error}` : ""}`
    );
  }
  console.log("");
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

void main();
