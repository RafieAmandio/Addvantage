# TradeVantage — VPS deploy guide

Production topology:

```
            Hosted Supabase (DB + Auth + Realtime)
                        ▲
                        │
  ┌─────────────────────┴─────────────────────┐
  │                  VPS                      │
  │   ┌─────────────┐     ┌───────────────┐   │
  │   │  Caddy :443 │───▶ │ Next.js :3000 │   │
  │   │  (TLS)      │     └───────────────┘   │
  │   └─────────────┘                          │
  │                      ┌───────────────┐    │
  │                      │ worker        │    │
  │                      │ (cron + bot)  │    │
  │                      └───────────────┘    │
  └───────────────────────────────────────────┘
```

## 0. Pre-flight (local, one-time)

Install toolchain:

```bash
brew install pnpm node@20
pnpm install
```

Verify build:

```bash
pnpm typecheck
pnpm build
```

Put local env in `apps/web/.env.local` and `apps/worker/.env`:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — `https://qawrdgttfpslyelocfmx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase dashboard → Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — same page, **server-only**
- `OPENAI_API_KEY` — from https://platform.openai.com/api-keys
- `TELEGRAM_BOT_TOKEN` — from BotFather after `/newbot`
- `TELEGRAM_ADMIN_CHAT_IDS` — your Telegram user id (DM `@userinfobot` and it replies with your id). Comma-separated for multiple admins
- `FRED_API_KEY` — free, register at https://fred.stlouisfed.org/docs/api/api_key.html
- `NEXT_PUBLIC_SITE_URL` / `SITE_URL` — `https://tradevantage.gg` in prod, `http://localhost:3000` in dev

Smoke test the worker without deploying:

```bash
pnpm --filter @tradevantage/worker run:once FRED
# should fetch FRED observations, call OpenAI, insert pending rows, ping Telegram
```

Smoke test the web app:

```bash
pnpm dev:web
# open http://localhost:3000/app/news — should render the seeded approved items
```

## 1. First admin user

1. Sign up at `https://tradevantage.gg/signup` (or localhost) with your own email.
2. In the Supabase dashboard SQL editor, run:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

3. Log in. `/admin/review` should now be accessible.

## 2. Whitelist your Telegram account

DM the bot `@addvantageBot` — it will tell you your chat id. Two options to whitelist:

**Option A — env var (simplest, requires worker restart to change):**

```bash
TELEGRAM_ADMIN_CHAT_IDS=123456789,987654321
```

**Option B — DB table (hot-reload, no restart):**

```sql
insert into public.telegram_admins (tg_user_id, label, active)
values (123456789, 'Adi — primary', true);
```

## 3. VPS bootstrap

Assumes Ubuntu 22.04+ with root. DNS: point `tradevantage.gg` and `www.tradevantage.gg` A records at the VPS IP **before** starting Caddy.

```bash
# Install docker + compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out/in, then:

# Install Caddy (for automatic Let's Encrypt)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Clone
sudo mkdir -p /srv/tradevantage
sudo chown $USER:$USER /srv/tradevantage
git clone <your-repo-url> /srv/tradevantage
cd /srv/tradevantage

# Env files — fill in from secrets
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env.production
$EDITOR apps/worker/.env apps/web/.env.production

# Caddy config
sudo cp infra/deploy/caddy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy

# Build + run
cd infra
docker compose build
docker compose up -d

# Verify
docker compose ps
docker compose logs -f worker
curl -I https://tradevantage.gg
```

## 4. Systemd (optional, for auto-restart on boot)

```bash
sudo cp infra/deploy/systemd/tradevantage-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tradevantage-worker
```

## 5. Deploy updates

```bash
cd /srv/tradevantage
git pull
cd infra
docker compose build
docker compose up -d
```

Applied DB migrations go through Supabase dashboard SQL editor or the MCP
`apply_migration` tool — **never** hand-edit prod schema from psql without a
corresponding file in `packages/db/migrations/`.

## 6. Secrets rotation checklist

Do this the first time you deploy (the keys used during development were shared
in a chat log and should be treated as compromised):

- **OpenAI:** platform.openai.com → API keys → revoke old, create new, update `.env`, redeploy worker.
- **Telegram bot:** BotFather → `/revoke` → new token → update `.env`, redeploy worker.
- **Supabase service role:** dashboard → Project Settings → API → "Reset service_role key" → update `.env`, redeploy worker **and** web.

## 7. Observability basics

- `docker compose logs -f worker` — live worker logs (pino JSON → pretty in dev).
- `select * from ingestion_runs order by started_at desc limit 20;` — last runs.
- `select code, enabled, last_polled_at, last_success_at, last_error from sources;` — source health.
- `/admin/sources` renders the same source health table inside the app.

## 8. Backup strategy

Supabase hosted handles PITR on paid tier. On free tier: take a nightly logical
dump via `pg_dump` from a cron on the VPS.

```bash
# crontab -e
0 3 * * * PGPASSWORD=... pg_dump -h db.qawrdgttfpslyelocfmx.supabase.co -U postgres -Fc postgres > /srv/backups/tv-$(date +\%F).dump
```

## 9. Domain + DNS

Cloudflare or your registrar:

| Record | Name | Value |
|---|---|---|
| A | `@` | `<VPS IP>` |
| A | `www` | `<VPS IP>` |
| CAA | `@` | `0 issue "letsencrypt.org"` |

Caddy will auto-provision TLS on first request. If you use Cloudflare orange-cloud proxy, set SSL/TLS mode to **Full (strict)**.

## 10. Known caveats

- **Scraping legality.** FRED is a public-domain US govt API — safe. SlickCharts factual data is low risk. SPDJI / Yardeni / RBC each have ToS; the rephrase step rewrites wording, but you should store `source_url` and keep audit trails in case a takedown request arrives. You may want to add a visible "Source: external research" footer on any item from those three.
- **Telegram long-polling** on the worker keeps a single connection open. If you scale to multiple worker replicas, switch to webhook mode and front the bot on a Next.js route handler instead (`app/api/telegram/route.ts`).
- **Supabase free tier** auto-pauses after 7 days of inactivity. For a production deploy upgrade to the Pro plan ($25/mo) before going live.

## 11. Automated deploy via GHCR + SSH

Once the VPS is bootstrapped manually (Section 3), subsequent worker deploys run automatically from CI:

1. Push to `main` with changes under `apps/worker/**`, `packages/shared/**`, `packages/db/**`, or any of the infra/Dockerfile paths listed in `.github/workflows/deploy-worker.yml`.
2. CI builds the worker image with the Dockerfile at `apps/worker/Dockerfile` and pushes to GHCR under `ghcr.io/<org>/<repo>/worker:<sha>` + `:latest`.
3. CI SSHes to the VPS, `git fetch` + `reset --hard origin/main` to sync the compose files, then pulls the new image and runs `docker compose up -d worker`. The `IMAGE_TAG` env var pins the exact sha so the container runs the same commit as the workflow run.

### Required repo secrets (Settings → Secrets and variables → Actions)

- `VPS_HOST` — IP or hostname
- `VPS_USER` — SSH user (the one with docker group membership)
- `VPS_SSH_KEY` — PEM-formatted private key. Generate with `ssh-keygen -t ed25519 -f deploy_key -C github-actions`; copy the public key to the VPS user's `~/.ssh/authorized_keys`; paste the private key into this secret.
- `VPS_DEPLOY_PATH` — absolute path to the repo clone on the VPS, e.g. `/srv/tradevantage`. The VPS must have this path already checked out (manual first deploy per Section 3).

### Manual rollback

SSH to the VPS, then:

```bash
cd $VPS_DEPLOY_PATH/infra
IMAGE_TAG=<previous-sha> docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d worker
```

GHCR keeps every sha tag — `latest` just trails the most recent deploy.

### GHCR package visibility

By default the GitHub Actions token can push private packages. If the worker package stays private, add a `GHCR_PULL_TOKEN` (classic PAT with `read:packages`) as a VPS env var and `docker login ghcr.io` on the VPS once. For public packages, no auth is needed on the VPS — simpler.
