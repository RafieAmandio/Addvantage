import * as Sentry from "@sentry/node";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { getAdapter } from "../adapters";
import { loadExistingHashes, persistCandidates } from "./persist";
import { notifyPending } from "../telegram/notify";

/**
 * One end-to-end run for a single source:
 *   open ingestion_runs row -> fetch -> persist -> notify -> close row.
 */
export async function runSource(sourceCode: string): Promise<void> {
  const adapter = getAdapter(sourceCode);
  if (!adapter) {
    logger.warn({ sourceCode }, "runSource: unknown adapter");
    return;
  }

  const { data: runRow } = await supabase()
    .from("ingestion_runs")
    .insert({ source_code: sourceCode, status: "running" })
    .select("id")
    .single();

  const started = Date.now();
  try {
    const existingHashes = await loadExistingHashes(sourceCode);
    const candidates = await adapter.fetch({ logger, existingHashes });
    logger.info({ sourceCode, count: candidates.length }, "fetched candidates");

    const result = await persistCandidates(sourceCode, candidates, existingHashes);
    logger.info({ sourceCode, ...result }, "persisted");

    if (result.insertedIds.length > 0) {
      await notifyPending(sourceCode, result.insertedIds);
    }

    await supabase()
      .from("ingestion_runs")
      .update({
        status: "ok",
        finished_at: new Date().toISOString(),
        items_fetched: candidates.length,
        items_new: result.inserted,
        items_rephrased: result.rephrased,
      })
      .eq("id", runRow?.id);

    await supabase()
      .from("sources")
      .update({
        last_polled_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("code", sourceCode);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { scope: "runSource", sourceCode },
    });
    logger.error({ err: String(err), sourceCode }, "runSource failed");
    await supabase()
      .from("ingestion_runs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        error: String(err),
      })
      .eq("id", runRow?.id);
    await supabase()
      .from("sources")
      .update({ last_polled_at: new Date().toISOString(), last_error: String(err) })
      .eq("code", sourceCode);
  } finally {
    logger.info({ sourceCode, ms: Date.now() - started }, "runSource done");
  }
}
