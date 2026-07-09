# Upgrade Radar scraper — CloakBrowser (patched Chromium) + Postgres writer.
# Runs as its own container so the headless browser is isolated from web/api/worker.
FROM python:3.12-slim

# Chromium runtime deps for the CloakBrowser patched binary.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation xvfb xauth \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libcairo2 libatspi2.0-0 libx11-6 \
    libxcb1 libxext6 libexpat1 libglib2.0-0 libxrender1 libxi6 \
    && rm -rf /var/lib/apt/lists/*

# HEADED=1 + xvfb: Turnstile clears far more reliably in headed mode; xvfb gives
# the headless container a virtual display so the browser can run "headed".
ENV NO_SANDBOX=1 \
    HEADED=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# NOTE: the patched Chromium binary is fetched by CloakBrowser on first launch()
# at runtime (the container has network). We deliberately do NOT pre-download it
# at build time — under cross-arch (amd64-on-arm64) buildx emulation a build-time
# browser launch runs under QEMU and can hang. First sync downloads it once.

COPY scraper.py sync.py run.py ./
# Run headed inside a virtual framebuffer.
CMD ["xvfb-run", "-a", "--server-args=-screen 0 1920x1080x24", "python", "run.py"]
