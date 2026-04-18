-- 0020_education_primers.sql
-- Section 2 M4 — move `/app/education` from mock data to Supabase.
--
-- Single table matches the flat content list the UI renders. RLS gates
-- unpublished drafts to admins; free vs paid gating uses `locked` (mirrors
-- existing client-side `isPaid(tier)` check so we don't churn the UI).
-- Mock `features/education/mock.ts` is retained as offline-dev fallback
-- and is still imported by non-education pages (search, tags, news cross-link)
-- that haven't been migrated to Supabase yet.

create table public.education_primers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  author text not null default 'Anthony',
  framework text,
  summary text,
  body text[] not null default '{}',
  tags text[] not null default '{}',
  reading_min int not null default 3 check (reading_min > 0),
  locked boolean not null default false,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index education_primers_published_sort_idx
  on public.education_primers (published, sort_order)
  where published = true;
create index education_primers_tags_gin
  on public.education_primers using gin (tags);

alter table public.education_primers enable row level security;

-- Public reads: published only (admins bypass via is_admin()).
-- Single policy OR-combines both cases to stay inside the "no multiple
-- permissive policies per (table,cmd)" convention (tick-73).
create policy education_primers_read on public.education_primers
  for select to anon, authenticated
  using (published = true or public.is_admin());

-- Admins-only write. Split per-command (insert/update/delete) so SELECT has
-- a single permissive policy (avoids multiple_permissive_policies warning).
-- Reuses the is_admin() helper (0003_rls.sql).
create policy education_primers_admin_insert on public.education_primers
  for insert to authenticated
  with check (public.is_admin());

create policy education_primers_admin_update on public.education_primers
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy education_primers_admin_delete on public.education_primers
  for delete to authenticated
  using (public.is_admin());

-- Touch updated_at on UPDATE, matching the pattern used on other tables.
create trigger education_primers_set_updated_at
  before update on public.education_primers
  for each row execute function public.touch_updated_at();

-- Seed existing mock primers. Slug = mock `id` to preserve deep-links
-- (`/app/education/P-001` etc) that may exist in wild.
insert into public.education_primers
  (slug, title, author, framework, summary, body, tags, reading_min, locked, published, sort_order)
values
  (
    'P-001',
    'Loss Aversion',
    'Anthony',
    'Kahneman & Tversky, 1979 — Prospect Theory',
    'The pain of losing a dollar is roughly twice the pleasure of gaining one. Most trading mistakes are downstream of this single asymmetry.',
    array[
      'Kahneman and Tversky''s prospect theory established that humans evaluate gains and losses asymmetrically. Losing $100 hurts about as much as gaining $200 feels good. Every trader has felt this — the inability to cut a loser, the rush to lock a winner too early.',
      'The trading expression of loss aversion is the ''disposition effect'': we hold losers too long and sell winners too quickly. Both behaviors are negative-EV. The losers are losers because the thesis broke; the winners are winners because the thesis is working.',
      'The fix is mechanical, not emotional. Pre-commit to your invalidation level before the trade is on. Write it down. When price hits, you exit — no analysis, no rationalisation. The whole point of the rule is to remove the moment of decision, because the moment of decision is exactly when loss aversion will hijack you.'
    ],
    array['loss-aversion','risk-management','losing-streak'],
    4,
    false,
    true,
    10
  ),
  (
    'P-002',
    'Recency Bias',
    'Anthony',
    'Tversky & Kahneman, 1973 — Availability Heuristic',
    'Your brain weights the last three trades more than the previous thirty. This is why winners get cocky and losers turn paranoid.',
    array[
      'The availability heuristic says we judge probability by how easily examples come to mind. After a string of wins, winning feels easy and we size up. After a string of losses, losing feels inevitable and we size down — exactly when we should be doing the opposite.',
      'Recency bias is most dangerous when your edge is real but the recent sample is small. A 55% system will still throw 5-loss streaks — not because it''s broken, but because variance.',
      'Counter it by tracking outcomes per setup, not per recent session. Your edge lives in 200-trade samples, not 20.'
    ],
    array['recency-bias','developing-edge','unprofitability'],
    3,
    true,
    true,
    20
  ),
  (
    'P-003',
    'Sunk Cost Trap',
    'Anthony',
    'Arkes & Blumer, 1985',
    'The money you''ve already lost on a trade has zero predictive power for what happens next. Your account doesn''t care how much you''ve put in — only what''s there now.',
    array[
      'Sunk cost fallacy is the reason traders average down on broken theses. The reasoning: ''I''m already down $X, so I might as well add to bring my average down.'' This is rational accounting and irrational trading.',
      'The question is never ''how do I recover what I lost''. The question is ''given today''s price and today''s information, would I open this trade right now?'' If the answer is no, you close. The previous loss is paid; you''re not getting it back from this trade.'
    ],
    array['sunk-cost','losing-streak','loss-aversion'],
    3,
    true,
    true,
    30
  ),
  (
    'P-004',
    'Surviving a Drawdown',
    'Anthony',
    'Operational protocol',
    'Drawdowns are not solved by trying harder. They are solved by trading smaller, slower, and with the same system you had before the streak began.',
    array[
      'When you''re down 8-10%, the temptation is to ''win it back''. This is the highest-mortality move in trading. The moment you start sizing up to recover faster, you''ve stopped trading your edge and started gambling.',
      'Protocol: cut size by 50% the moment you cross your drawdown threshold. Trade the exact same setups, the exact same way, just smaller. Hold position until you''ve returned to peak — not because the small size is profitable, but because it keeps you in the seat without doing damage. The edge does the work.',
      'If the drawdown extends beyond 2x your historical worst, stop entirely. Audit the system. Most extended drawdowns are not bad luck — they''re regime change you haven''t recognised yet.'
    ],
    array['losing-streak','risk-management','developing-edge'],
    5,
    true,
    true,
    40
  ),
  (
    'P-005',
    'Building an Edge',
    'Anthony',
    'Process protocol',
    'Edge is built in three phases: hypothesis, sample, refinement. Most traders never finish phase one.',
    array[
      'Phase 1 — Hypothesis. State the setup in one sentence: ''When X happens in Y context, Z is more likely than chance.'' If you can''t state it that cleanly, you don''t have an edge yet, you have a vibe.',
      'Phase 2 — Sample. Trade the setup exactly as defined for at least 50 instances. No deviations. No ''this one''s different.'' Track every outcome.',
      'Phase 3 — Refinement. Look at the losers. What context filtered them? Add the filter, retest. This is where 90% of the work is.'
    ],
    array['developing-edge','unprofitability'],
    4,
    true,
    true,
    60
  ),
  (
    'P-006',
    'IDX Foreign Flow as a Signal',
    'Anthony',
    'IDX market microstructure',
    'In a market where local liquidity is thin and dominated by retail, foreign net buy/sell is the cleanest read on positioning. Most traders watch the wrong number.',
    array[
      'JKSE is structurally different from Western indices. Free float is concentrated in a handful of names — BBCA, BBRI, BMRI, BBNI, TLKM, ASII — and foreign ownership of those names regularly exceeds 50%. That single fact changes how you should read the tape.',
      'The headline ''foreign net buy: +Rp 1.2T'' is almost useless. The real signal is concentration. If foreign buying is spread across 30+ names, it''s index-level positioning — slow, structural, and not actionable on the day. If it''s concentrated in 3-4 banks, it''s a directional bet on the rupiah, the BI decision, or the carry trade. Two completely different trades, same headline number.',
      'The check: pull the top-5 foreign-net-buy names and the top-5 sell names. If the buy side is dominated by big-four banks AND the sell side is dominated by exporters (commodities, palm oil), the trade is a long-IDR carry positioning bet. If the buy side is exporters and the sell side is banks, it''s the opposite — foreigners are positioning for IDR weakness.',
      'Layer this onto USDIDR. When BI is defending a rupiah level (currently 16,000), foreign concentration in banks is the early signal that someone believes the defence will hold. When that concentration breaks, it usually breaks 24-48h before the rupiah does.'
    ],
    array['developing-edge','trend-following'],
    5,
    true,
    true,
    50
  );
