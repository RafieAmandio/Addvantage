import { prisma } from "@tradevantage/db";
import { contentHash } from "../lib/hash";
import { logger } from "../lib/logger";
import { rephrase } from "./rephrase";
import type { Candidate } from "../adapters/base";

interface PersistResult {
  inserted: number;
  skipped: number;
  rephrased: number;
  errors: number;
  insertedIds: string[];
}

/**
 * Takes fresh Candidates from an adapter and:
 *   1. Computes content_hash.
 *   2. Skips any hash already present (dedupe).
 *   3. Calls OpenAI to rephrase.
 *   4. INSERTs rows with status='pending'.
 * Returns counters + ids the bot can notify on.
 */
export async function persistCandidates(
  sourceCode: string,
  candidates: Candidate[],
  existingHashes: Set<string>
): Promise<PersistResult> {
  const result: PersistResult = {
    inserted: 0,
    skipped: 0,
    rephrased: 0,
    errors: 0,
    insertedIds: [],
  };

  for (const c of candidates) {
    const hash = contentHash([sourceCode, c.externalId, c.rawText]);
    if (existingHashes.has(hash)) {
      result.skipped++;
      continue;
    }
    existingHashes.add(hash);

    let rephraseResult;
    try {
      rephraseResult = await rephrase(sourceCode, c.rawText, c.meta);
      result.rephrased++;
    } catch (err) {
      logger.error({ err: String(err), externalId: c.externalId }, "rephrase failed");
      result.errors++;
      continue;
    }

    const { output: rephrased } = rephraseResult;

    const affects = c.canonicalAffects ?? rephrased.affects;
    const impact = c.canonicalImpact ?? rephrased.impact;

    try {
      const row = await prisma.newsItem.create({
        data: {
          sourceCode,
          sourceUrl: c.sourceUrl,
          contentHash: hash,
          fetchedAt: new Date(),
          rawText: c.rawText,
          headline: rephrased.headline,
          rephrased: rephrased.rephrased,
          analysis: rephrased.analysis,
          impact,
          bias: rephrased.bias,
          affects,
          tags: rephrased.tags,
          author: `[${sourceCode}]`,
          status: "pending",
          aiSystemPrompt: rephraseResult.systemPrompt,
          aiUserMessage: rephraseResult.userMessage,
          aiRawResponse: rephraseResult.rawResponse,
        },
        select: { id: true },
      });
      result.inserted++;
      result.insertedIds.push(row.id);
    } catch (err) {
      logger.error({ err: String(err), externalId: c.externalId }, "insert failed");
      result.errors++;
    }
  }

  return result;
}

/**
 * Load the set of existing content_hashes for a source so the adapter run can
 * dedupe without one round-trip per candidate.
 */
export async function loadExistingHashes(sourceCode: string): Promise<Set<string>> {
  try {
    const rows = await prisma.newsItem.findMany({
      where: { sourceCode },
      select: { contentHash: true },
    });
    return new Set(rows.map((r) => r.contentHash));
  } catch (err) {
    logger.error({ err: String(err), sourceCode }, "loadExistingHashes failed");
    return new Set();
  }
}
