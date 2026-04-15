# TradeVantage — Vercel deploy guide

`apps/web` is the Next.js app. It depends on two local workspace packages
(`@tradevantage/shared`, `@tradevantage/db`) that ship raw TypeScript. Vercel
needs to know about the monorepo layout or the build will fail.

## One-time project setup on Vercel

Create the project by importing `github.com/RafieAmandio/Addvantage`. Then in
**Project Settings → General**:

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | Either *blank* OR `apps/web` — both work |
| **Node.js Version** | 20.x |
| **Install Command** | *(override from `vercel.json`)* |
| **Build Command** | *(override from `vercel.json`)* |
| **Output Directory** | *(override from `vercel.json`)* |

> Two `vercel.json` files are committed: one at repo root (used when Root
> Directory is blank) and one at `apps/web/vercel.json` (used when Root
> Directory = `apps/web`). Whichever you pick, the commands are the same
> shape — install + build at the workspace root, filter to the web app.
>
> You should NOT also set install/build/output in the dashboard — dashboard
> settings and `vercel.json` conflict unpredictably.

## Environment Variables

Go to **Project Settings → Environment Variables** and add these to **Production**
and **Preview** scopes:

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qawrdgttfpslyelocfmx.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(from Supabase dashboard → API)* | Public |
| `NEXT_PUBLIC_SITE_URL` | `https://tradevantage.gg` | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from Supabase dashboard → API)* | **Server-only** — never prefix `NEXT_PUBLIC_`. Used by admin actions. |

> Without these, the build itself still succeeds (every page that touches
> Supabase is `dynamic = "force-dynamic"`), but the first runtime request
> will 500 from middleware when it tries to create a Supabase client.

## Why these exact commands?

`vercel.json` at the repo root:

```json
{
  "buildCommand": "pnpm turbo run build --filter=@tradevantage/web...",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- apps/web packages"
}
```

- **`installCommand`** — runs `pnpm install` at the **repo root**, which resolves
  the whole pnpm workspace (including `packages/shared` and `packages/db` as
  linked deps). Running it inside `apps/web/` would fail because pnpm wouldn't
  see the workspace root and couldn't resolve `workspace:*` specifiers.
- **`buildCommand`** — `turbo run build --filter=@tradevantage/web...` builds the
  web app **and** its transitive workspace deps in the correct order. The `...`
  suffix says "include dependencies". Without this, Turborepo tries to build
  `apps/worker` too, which isn't needed on Vercel.
- **`outputDirectory`** — points Vercel at `apps/web/.next` so it knows where
  the built `.next/` actually lives.
- **`ignoreCommand`** — skips redeploys when nothing in `apps/web` or `packages/`
  changed (e.g. a README edit shouldn't rebuild).

And `apps/web/next.config.js`:

```js
transpilePackages: ["@tradevantage/shared", "@tradevantage/db"],
experimental: { outputFileTracingRoot: "../../" },
```

- **`transpilePackages`** — the workspace packages export `.ts` source directly
  (no `dist/`). Without this, Next's SWC loader hits the `.ts` and errors.
- **`outputFileTracingRoot`** — tells Next to trace files from the monorepo
  root when packaging the serverless functions. Otherwise `pnpm`'s hoisted
  deps in `<root>/node_modules/.pnpm` get missed and you get runtime "cannot
  find module" errors inside the lambda.

## Typical first-deploy failures and their fixes

### `Cannot find module '@tradevantage/shared'`

You forgot `transpilePackages` in `next.config.js`, OR Vercel is installing inside
`apps/web/` instead of the repo root. Check `vercel.json` is committed at repo
root, and that no dashboard **Install Command** override is overriding it.

### `ERR_PNPM_NO_MATCHING_VERSION` or `ERR_PNPM_PEER_DEP_ISSUES`

You're on a pnpm lockfile mismatch. Commit `pnpm-lock.yaml` and redeploy. Make
sure Vercel is using pnpm — check the "Install Command" logs at the top of
the build.

### `Module not found: Can't resolve 'fs'` (or similar Node builtin)

A client component is trying to import something that only works server-side.
Not currently an issue in this repo but worth noting.

### Build succeeds, all routes 500 at runtime

Env vars missing in Vercel project settings. Add the 4 vars listed above and
redeploy. You don't need to rebuild — middleware + dynamic routes will read
them on the next request.

### `Error: Dynamic server usage: cookies`

Happens if a page using `supabaseServer()` isn't marked `dynamic = "force-dynamic"`.
Every page in this repo that touches cookies or the DB already sets it — but
if you add a new server component that calls `supabaseServer()`, add the
export at the top:

```tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

### First build hangs on "Collecting build traces"

Usually means `outputFileTracingRoot` is wrong and Next is trying to trace
your entire home directory. Keep the `path.join(__dirname, "../../")` form —
do not use `process.cwd()`.

## Local verification before pushing

Run the exact command Vercel will run:

```bash
rm -rf apps/web/.next .turbo
pnpm install --frozen-lockfile
pnpm turbo run build --filter=@tradevantage/web...
```

If this passes locally, it will pass on Vercel.
