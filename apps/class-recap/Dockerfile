# Class recap bot. Build context: repo root (same as the other apps).
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-requests python3-psycopg2 ffmpeg pandoc chromium rclone fonts-noto-color-emoji ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g @openai/codex@0.169.0 \
    && mkdir -p /data && chown node /data
WORKDIR /app
COPY apps/class-recap/ /app/
# uid 1000 = node, same uid as the worker, so the shared Codex login volume is readable
USER node
ENV DATA_DIR=/data PYTHONUNBUFFERED=1 CODEX_HOME=/codex
CMD ["python3", "/app/recap.py"]
