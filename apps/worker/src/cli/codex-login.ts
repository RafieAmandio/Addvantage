// One-time ChatGPT sign-in for LLM_PROVIDER=codex.
// Usage (in the worker container): pnpm --filter @tradevantage/worker codex:login [path]
// Default path = CODEX_AUTH_FILE. Prints only the device URL and code, never a token.
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { codexDeviceLogin } from "../lib/codex";

const path = process.argv[2] ?? process.env.CODEX_AUTH_FILE ?? "/data/codex/auth.json";
await mkdir(dirname(path), { recursive: true, mode: 0o700 });
await codexDeviceLogin(path, (line) => console.log(line));
