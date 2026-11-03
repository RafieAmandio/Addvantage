/**
 * Dry run of the macro sources: fetches everything and prints a summary,
 * writes nothing unless a path is given (then the JSON goes there, e.g. a web mock fixture).
 * Usage: pnpm --filter @tradevantage/worker run:macro [out.json]
 */
import { writeFileSync } from "node:fs";
import { CURRENCIES, fetchMacro } from "../macro/sync-macro";

void (async () => {
  const { data, failures } = await fetchMacro();
  if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({ ...data, syncedAt: new Date().toISOString() }, null, 2));
  for (const c of CURRENCIES) {
    const b = data.banks[c];
    const top = b?.odds?.outcomes[0];
    console.log(c, b?.bank, b?.rate, b?.lastChange ?? "", b?.lastChangeDate ?? "", top ? `${top.label} ${(top.p * 100).toFixed(0)}% (${b!.odds!.meetingDate.slice(0, 10)})` : "no odds");
  }
  console.log("10y", data.yields10y?.months.at(-1), JSON.stringify(Object.fromEntries(Object.entries(data.yields10y?.series ?? {}).map(([k, v]) => [k, v?.at(-1)]))));
  console.log("us", data.usCurve, "vix", data.risk.vix?.v, "move", data.risk.move?.v, "hy", data.risk.hy?.v, data.risk.hy?.change);
  console.assert(failures === 0, `${failures} step(s) failed`);
  process.exit(failures ? 1 : 0);
})();
