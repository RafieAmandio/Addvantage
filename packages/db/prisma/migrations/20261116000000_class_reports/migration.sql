-- class_reports: VIP class recaps (Reports tab under /app/education). One row is
-- one report; the content is a PDF on Google Drive, stored as its file id only.
--
-- Prod already has this table: it was created by hand from
-- packages/db/migrations/0044_class_reports.sql on the old education-reports
-- branch. This migration reproduces that exact shape (columns, partial index,
-- RLS policies, updated_at trigger) and is guarded on the table's existence, so
-- `prisma migrate deploy` on prod does nothing but record it as applied.
--
-- Reads go through the API, which gates them to vip/admin so drive_id never
-- reaches free-tier clients. RLS is defense in depth for direct PostgREST access.

DO $$
BEGIN
  IF to_regclass('public.class_reports') IS NOT NULL THEN
    RAISE NOTICE 'class_reports already exists, skipping';
    RETURN;
  END IF;

  CREATE TABLE public.class_reports (
    id           uuid primary key default gen_random_uuid(),
    slug         text not null unique,
    title        text not null,
    summary      text not null default '',
    author       text not null default 'Anthony',
    drive_id     text not null,
    published_at timestamptz(6),
    sort_order   int not null default 0,
    published    boolean not null default false,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
  );

  CREATE INDEX class_reports_pub_idx
    ON public.class_reports (published, sort_order)
    WHERE published = true;

  ALTER TABLE public.class_reports ENABLE ROW LEVEL SECURITY;

  CREATE POLICY class_reports_read ON public.class_reports
    FOR SELECT TO anon, authenticated
    USING (published = true OR public.is_admin());

  CREATE POLICY class_reports_admin_insert ON public.class_reports
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

  CREATE POLICY class_reports_admin_update ON public.class_reports
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

  CREATE POLICY class_reports_admin_delete ON public.class_reports
    FOR DELETE TO authenticated
    USING (public.is_admin());

  CREATE TRIGGER class_reports_set_updated_at
    BEFORE UPDATE ON public.class_reports
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
END $$;
