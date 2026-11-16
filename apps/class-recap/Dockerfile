# Class recap bot. Build context: repo root (same as the other apps).
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-requests python3-psycopg2 ffmpeg pandoc chromium rclone fonts-noto-color-emoji ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g @anthropic-ai/claude-code@2.1.325 \
    && useradd -m -u 10001 app && mkdir -p /data && chown app /data
WORKDIR /app
COPY apps/class-recap/ /app/
USER app
ENV DATA_DIR=/data PYTHONUNBUFFERED=1
CMD ["python3", "/app/recap.py"]
