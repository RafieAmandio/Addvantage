import { prisma } from "@tradevantage/db";
import { rephrase } from "../pipeline/rephrase";

async function main() {
  const args = new Set(process.argv.slice(2));
  const onlyApproved = args.has("--approved");
  const source = [...args].find((a) => !a.startsWith("--"));

  const where: Record<string, unknown> = {};
  if (onlyApproved) where.status = "approved";
  if (source) where.sourceCode = source;

  const items = await prisma.newsItem.findMany({
    where,
    select: { id: true, sourceCode: true, rawText: true, headline: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${items.length} items to re-rephrase`);

  let ok = 0;
  let fail = 0;

  for (const item of items) {
    if (!item.rawText) {
      console.log(`  SKIP ${item.id} — no rawText`);
      continue;
    }

    try {
      const result = await rephrase(item.sourceCode, item.rawText);
      const { output } = result;

      await prisma.newsItem.update({
        where: { id: item.id },
        data: {
          headline: output.headline,
          rephrased: output.rephrased,
          analysis: output.analysis,
          impact: output.impact,
          bias: output.bias,
          affects: output.affects,
          tags: output.tags,
          aiSystemPrompt: result.systemPrompt,
          aiUserMessage: result.userMessage,
          aiRawResponse: result.rawResponse,
        },
      });

      ok++;
      console.log(`  OK   ${item.id} — ${output.headline.slice(0, 60)}`);
    } catch (err) {
      fail++;
      console.log(`  FAIL ${item.id} — ${String(err).slice(0, 80)}`);
    }
  }

  console.log(`\nDone: ${ok} updated, ${fail} failed`);
  process.exit(0);
}

main().catch((err) => {
  console.error("re-rephrase failed:", err);
  process.exit(1);
});
