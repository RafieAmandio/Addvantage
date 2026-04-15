/**
 * One-shot CLI: run a single source adapter end-to-end, useful for manual
 * testing and debugging without starting the scheduler.
 *
 * Usage:
 *   pnpm --filter @tradevantage/worker run:once FRED
 *   pnpm --filter @tradevantage/worker run:once SC
 */
import { logger } from "../lib/logger";
import { runSource } from "../pipeline/runSource";
import { ADAPTERS } from "../adapters";

async function main() {
  const code = process.argv[2]?.toUpperCase();
  if (!code) {
    console.error(
      `usage: run:once <SOURCE_CODE>\nknown: ${ADAPTERS.map((a) => a.code).join(", ")}`
    );
    process.exit(1);
  }
  await runSource(code);
  logger.info({ code }, "run-once finished");
  process.exit(0);
}

void main();
