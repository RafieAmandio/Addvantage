import * as Sentry from "@sentry/node";
import { prisma } from "@tradevantage/db";
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

  const runRow = await prisma.ingestionRun.create({
    data: { sourceCode, status: "running" },
    select: { id: true },
  });

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

    await prisma.ingestionRun.update({
      where: { id: runRow.id },
      data: {
        status: "ok",
        finishedAt: new Date(),
        itemsFetched: candidates.length,
        itemsNew: result.inserted,
        itemsRephrased: result.rephrased,
      },
    });

    await prisma.source.update({
      where: { code: sourceCode },
      data: {
        lastPolledAt: new Date(),
        lastSuccessAt: new Date(),
        lastError: null,
      },
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { scope: "runSource", sourceCode },
    });
    logger.error({ err: String(err), sourceCode }, "runSource failed");
    await prisma.ingestionRun.update({
      where: { id: runRow.id },
      data: {
        status: "error",
        finishedAt: new Date(),
        error: String(err),
      },
    });
    await prisma.source.update({
      where: { code: sourceCode },
      data: { lastPolledAt: new Date(), lastError: String(err) },
    });
  } finally {
    logger.info({ sourceCode, ms: Date.now() - started }, "runSource done");
  }
}
