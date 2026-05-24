-- Channel threads: named topic containers for channel posts
CREATE TABLE channel_threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX idx_channel_threads_sort ON channel_threads(sort_order);

ALTER TABLE channel_posts ADD COLUMN thread_id UUID REFERENCES channel_threads(id) ON DELETE SET NULL;
CREATE INDEX idx_channel_posts_thread ON channel_posts(thread_id);

-- RLS
ALTER TABLE channel_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read threads" ON channel_threads FOR SELECT USING (true);
CREATE POLICY "Admin manage threads" ON channel_threads FOR ALL USING (public.is_admin());
