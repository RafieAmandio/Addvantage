/**
 * LLM_PROVIDER=codex: the AI pipeline runs on a ChatGPT subscription through the Codex backend
 * (the Responses API the Codex CLI calls when signed in with ChatGPT). No API key; the OAuth tokens
 * live in CODEX_AUTH_FILE, written once by `pnpm --filter @tradevantage/worker codex:login <path>`.
 * Ported from arah-social packages/ai/src/providers/codex-auth.ts.
 *
 * Give this worker its OWN sign-in (own auth.json). OpenAI rotates refresh tokens, so two clients
 * sharing one file without the lock below sign each other out.
 */
import { open, readFile, rename, rm, stat, writeFile, chmod } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const CODEX_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"; // Codex CLI's public OAuth client
const ISSUER = "https://auth.openai.com";
const CODEX_URL = "https://chatgpt.com/backend-api/codex/responses";
/** Sent as the CLI version; the backend gates newer models on it. */
const CLIENT_VERSION = "0.160.0";
const REFRESH_EARLY_MS = 5 * 60_000;
const LOCK_STALE_MS = 30_000;

type AuthFile = {
  auth_mode?: string;
  OPENAI_API_KEY?: null;
  tokens: { id_token?: string; access_token: string; refresh_token: string; account_id?: string };
  last_refresh?: string;
};

export class CodexAuthError extends Error {
  constructor() {
    super("codex: not signed in or refresh token revoked; run codex:login again");
  }
}

function claims(jwt: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString());
  } catch {
    return {};
  }
}
const expiresAt = (jwt: string) => Number(claims(jwt).exp ?? 0) * 1000;
const accountIdOf = (f: AuthFile) =>
  f.tokens.account_id ??
  (claims(f.tokens.access_token)["https://api.openai.com/auth"] as { chatgpt_account_id?: string } | undefined)
    ?.chatgpt_account_id;

async function writeAuth(path: string, file: AuthFile) {
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(file, null, 2), { mode: 0o600 });
  await chmod(tmp, 0o600);
  await rename(tmp, path);
}

const postToken = (form: Record<string, string>) =>
  fetch(`${ISSUER}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
  });

async function withFileLock<T>(path: string, run: () => Promise<T>): Promise<T> {
  const lock = `${path}.lock`;
  for (let i = 0; ; i++) {
    try {
      await (await open(lock, "wx")).close();
      break;
    } catch (e) {
      if ((e as { code?: string }).code !== "EEXIST") throw e;
      const age = await stat(lock).then((s) => Date.now() - s.mtimeMs, () => 0);
      if (age > LOCK_STALE_MS || i > 200) await rm(lock, { force: true });
      else await sleep(100);
    }
  }
  try {
    return await run();
  } finally {
    await rm(lock, { force: true });
  }
}

export function createCodexTokenStore(path: string) {
  let inflight: Promise<{ accessToken: string; accountId: string }> | null = null;
  const read = async (): Promise<AuthFile> => {
    try {
      const f = JSON.parse(await readFile(path, "utf8"));
      if (f?.tokens?.access_token && f.tokens.refresh_token) return f;
    } catch {}
    throw new CodexAuthError();
  };
  const creds = (f: AuthFile) => {
    const accountId = accountIdOf(f);
    if (!accountId) throw new CodexAuthError();
    return { accessToken: f.tokens.access_token, accountId };
  };
  const fresh = (f: AuthFile) => expiresAt(f.tokens.access_token) - Date.now() > REFRESH_EARLY_MS;

  // One refresh at a time; re-read under the lock because another holder may have refreshed already
  // (reusing a spent refresh token signs the account out).
  const refresh = () =>
    withFileLock(path, async () => {
      const f = await read();
      if (fresh(f)) return creds(f);
      const res = await postToken({
        grant_type: "refresh_token",
        refresh_token: f.tokens.refresh_token,
        client_id: CODEX_CLIENT_ID,
      });
      if (res.status >= 400 && res.status < 500) throw new CodexAuthError();
      if (!res.ok) throw new Error(`codex: token refresh failed (${res.status})`);
      const b = (await res.json()) as { access_token?: string; refresh_token?: string; id_token?: string };
      if (!b.access_token) throw new CodexAuthError();
      const next: AuthFile = {
        ...f,
        tokens: {
          ...f.tokens,
          access_token: b.access_token,
          refresh_token: b.refresh_token ?? f.tokens.refresh_token,
          ...(b.id_token ? { id_token: b.id_token } : {}),
        },
        last_refresh: new Date().toISOString(),
      };
      await writeAuth(path, next);
      return creds(next);
    });

  return {
    async get(force = false) {
      const f = await read();
      if (!force && fresh(f)) return creds(f);
      inflight ??= refresh().finally(() => (inflight = null));
      return inflight;
    },
  };
}

/** The Codex CLI's device-code sign-in. Prints only the URL and code, never a token. */
export async function codexDeviceLogin(path: string, print: (s: string) => void) {
  const json = { "content-type": "application/json" };
  const start = await fetch(`${ISSUER}/api/accounts/deviceauth/usercode`, {
    method: "POST",
    headers: json,
    body: JSON.stringify({ client_id: CODEX_CLIENT_ID }),
  });
  if (!start.ok) throw new Error(`device code request failed (${start.status})`);
  const d = (await start.json()) as { user_code: string; device_auth_id: string; interval?: string | number };
  print(`Open ${ISSUER}/codex/device and enter the code ${d.user_code}`);
  print("Waiting for the sign-in (15 minutes)...");
  const interval = Math.max(3, Number(d.interval ?? 5)) * 1000;
  const deadline = Date.now() + 15 * 60_000;
  let grant: { authorization_code: string; code_verifier: string } | null = null;
  while (!grant && Date.now() < deadline) {
    await sleep(interval);
    const poll = await fetch(`${ISSUER}/api/accounts/deviceauth/token`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ device_auth_id: d.device_auth_id, user_code: d.user_code }),
    });
    if (poll.status === 403 || poll.status === 404) continue; // not approved yet
    if (!poll.ok) throw new Error(`device sign-in failed (${poll.status})`);
    grant = (await poll.json()) as { authorization_code: string; code_verifier: string };
  }
  if (!grant) throw new Error("sign-in timed out");
  const res = await postToken({
    grant_type: "authorization_code",
    code: grant.authorization_code,
    redirect_uri: `${ISSUER}/deviceauth/callback`,
    client_id: CODEX_CLIENT_ID,
    code_verifier: grant.code_verifier,
  });
  if (!res.ok) throw new Error(`token exchange failed (${res.status})`);
  const t = (await res.json()) as { id_token: string; access_token: string; refresh_token: string };
  const file: AuthFile = {
    auth_mode: "chatgpt",
    OPENAI_API_KEY: null,
    tokens: { id_token: t.id_token, access_token: t.access_token, refresh_token: t.refresh_token },
    last_refresh: new Date().toISOString(),
  };
  const accountId = accountIdOf(file);
  if (!accountId) throw new Error("token has no ChatGPT account id");
  file.tokens.account_id = accountId;
  await writeAuth(path, file);
  print(`Signed in. Tokens written to ${path}`);
}

/** Final text of a Codex Responses SSE stream. */
export function textFromStream(sse: string): string {
  const done: string[] = [];
  let deltas = "";
  for (const line of sse.split("\n")) {
    if (!line.startsWith("data:")) continue;
    let ev: { type?: string; delta?: string; text?: string; response?: { error?: { message?: string } } };
    try {
      ev = JSON.parse(line.slice(5));
    } catch {
      continue;
    }
    if (ev.type === "response.output_text.delta") deltas += ev.delta ?? "";
    else if (ev.type === "response.output_text.done") done.push(ev.text ?? "");
    else if (ev.type === "response.failed" || ev.type === "error")
      throw new Error(`codex: ${ev.response?.error?.message ?? "response failed"}`);
  }
  return (done.join("") || deltas).trim();
}

/** POST one Responses call to the Codex backend; retries once with a forced refresh on 401. */
export async function codexRespond(
  tokens: ReturnType<typeof createCodexTokenStore>,
  body: Record<string, unknown>,
): Promise<string> {
  for (const force of [false, true]) {
    const { accessToken, accountId } = await tokens.get(force);
    const res = await fetch(CODEX_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
        authorization: `Bearer ${accessToken}`,
        "chatgpt-account-id": accountId,
        originator: "codex_cli_rs",
        "user-agent": `codex_cli_rs/${CLIENT_VERSION} (tradevantage-worker)`,
      },
      body: JSON.stringify({ ...body, stream: true, store: false }),
    });
    if (res.status === 401 && !force) continue;
    if (!res.ok) throw new Error(`codex: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    return textFromStream(await res.text());
  }
  throw new CodexAuthError();
}
