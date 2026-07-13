#!/usr/bin/env bash
# Build TradeVantage images locally (linux/amd64), push to GHCR, and trigger
# Dokploy to pull + redeploy. Replaces building on the 4GB VPS.
#
# Usage:
#   scripts/deploy-local.sh              # web api worker
#   scripts/deploy-local.sh web          # just web
#   SKIP_DEPLOY=1 scripts/deploy-local.sh api   # build+push only
#
# One-time setup:
#   gh auth refresh -h github.com -s write:packages,read:packages
#   gh auth token | docker login ghcr.io -u RafieAmandio --password-stdin
#
# Dokploy apps must be switched to the Docker-image source pointing at the
# :latest tags below (see CLAUDE.md "Deploying" section).
set -euo pipefail
cd "$(dirname "$0")/.."

REGISTRY="ghcr.io/rafieamandio"
SHA=$(git rev-parse --short HEAD)
DOKPLOY_URL="https://dashboard.tradevantage.gg"

# Dokploy application IDs (see CLAUDE.md deployment table)
app_id() {
  case "$1" in
    web)             echo "g-kctMkTjn_hr_n9I_GAD" ;;
    api)             echo "llgO8uAqXsHJYILDxDorp" ;;
    worker)          echo "5Az6Gqlcv7l2yH6PfAvAB" ;;
    # Upgrade Radar scraper — its own container (headed CloakBrowser under xvfb,
    # HEADED=1 baked into the image). Fill in the Dokploy application id after
    # creating the app (Docker image source: ghcr.io/rafieamandio/tradevantage-upgrade-scraper:latest).
    upgrade-scraper) echo "" ;;
  esac
}

# NEXT_PUBLIC_* are inlined into the client bundle at build time — they are
# public by design (the anon key ships in every page load already).
WEB_BUILD_ARGS=(
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://mlbcppehtoytqqbrkirn.supabase.co
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYmNwcGVodG95dHFxYnJraXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjgxNzMsImV4cCI6MjA5MjcwNDE3M30.P0bQzXApvPxMgM4nQ4yp_hUmEz-idkwfKMEkTh-L304
  --build-arg NEXT_PUBLIC_SITE_URL=https://tradevantage.gg
  --build-arg NEXT_PUBLIC_API_URL=https://api.tradevantage.gg
  --build-arg NEXT_PUBLIC_MOCK_MODE=0
)

SERVICES=("$@")
[ ${#SERVICES[@]} -eq 0 ] && SERVICES=(web api worker)

for svc in "${SERVICES[@]}"; do
  image="$REGISTRY/tradevantage-$svc"
  echo "==> building $image ($SHA)"
  args=()
  [ "$svc" = "web" ] && args=("${WEB_BUILD_ARGS[@]}")
  docker buildx build \
    --platform linux/amd64 \
    -f "apps/$svc/Dockerfile" \
    "${args[@]+"${args[@]}"}" \
    -t "$image:latest" -t "$image:$SHA" \
    --push .
done

if [ "${SKIP_DEPLOY:-0}" = "1" ]; then
  echo "==> SKIP_DEPLOY=1, not triggering Dokploy"
  exit 0
fi

echo "==> triggering Dokploy redeploys"
read -r -s -p "Dokploy password for tradevantage.gg@gmail.com: " DK_PASS; echo
COOKIES=$(mktemp)
trap 'rm -f "$COOKIES"' EXIT
curl -sf -X POST "$DOKPLOY_URL/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' -c "$COOKIES" \
  -d "{\"email\":\"tradevantage.gg@gmail.com\",\"password\":\"$DK_PASS\"}" > /dev/null

for svc in "${SERVICES[@]}"; do
  id=$(app_id "$svc")
  curl -sf -X POST "$DOKPLOY_URL/api/trpc/application.deploy" \
    -H 'Content-Type: application/json' -b "$COOKIES" \
    -d "{\"json\":{\"applicationId\":\"$id\"}}" > /dev/null
  echo "    $svc deploy triggered"
done
echo "==> done — watch progress at $DOKPLOY_URL"
