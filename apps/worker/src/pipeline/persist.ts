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

// Sources where each item has a unique source_url (safe for URL-based dedup).
// Most scraped sources reuse the same page URL for different observations.
const URL_DEDUP_SOURCES = new Set(["TRUMP"]);

/**
 * Takes fresh Candidates from an adapter and:
 *   1. Checks source_url (catches dupes where rawText varies per run).
 *   2. Computes content_hash from (sourceCode, externalId).
 *   3. Skips any hash already present (dedupe).
 *   4. Calls OpenAI to rephrase.
 *   5. INSERTs rows with status='approved' (auto-published).
 * Returns counters + ids the bot can notify on.
 */
export async function persistCandidates(
  sourceCode: string,
  candidates: Candidate[],
  existingHashes: Set<string>,
  existingUrls: Set<string> = new Set(),
): Promise<PersistResult> {
  const result: PersistResult = {
    inserted: 0,
    skipped: 0,
    rephrased: 0,
    errors: 0,
    insertedIds: [],
  };

  for (const c of candidates) {
    // Skip candidates with barely any content — the LLM can't produce
    // meaningful analysis from a headline alone.
    if (c.rawText.length < 60) {
      logger.warn({ externalId: c.externalId, len: c.rawText.length }, "skipping thin candidate");
      result.skipped++;
      continue;
    }

    if (URL_DEDUP_SOURCES.has(sourceCode) && c.sourceUrl && existingUrls.has(c.sourceUrl)) {
      result.skipped++;
      continue;
    }

    const hash = contentHash([sourceCode, c.externalId]);
    if (existingHashes.has(hash)) {
      result.skipped++;
      continue;
    }
    existingHashes.add(hash);
    if (c.sourceUrl) existingUrls.add(c.sourceUrl);

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
          status: "approved",
          publishedAt: new Date(),
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

/**
 * Load existing source_urls for a source. Used as a secondary dedup layer
 * to catch items where the rawText varies between runs (e.g. AI vision
 * descriptions, live market data) but the source URL stays the same.
 */
export async function loadExistingSourceUrls(sourceCode: string): Promise<Set<string>> {
  try {
    const rows = await prisma.newsItem.findMany({
      where: { sourceCode },
      select: { sourceUrl: true },
      distinct: ["sourceUrl"],
    });
    return new Set(rows.map((r) => r.sourceUrl).filter((u): u is string => u != null));
  } catch (err) {
    logger.error({ err: String(err), sourceCode }, "loadExistingSourceUrls failed");
    return new Set();
  }
}
