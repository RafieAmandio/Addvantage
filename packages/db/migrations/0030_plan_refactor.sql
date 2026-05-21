-- 0030_plan_refactor.sql
-- Add plan-level bias (bullish/bearish/neutral), first-class risks column,
-- and backfill from existing direction + __risks__ JSONB sentinel.

-- 1. bias column
ALTER TABLE trading_plans ADD COLUMN bias text;

UPDATE trading_plans SET bias = CASE
  WHEN direction = 'long'  THEN 'bullish'
  WHEN direction = 'short' THEN 'bearish'
  ELSE 'neutral'
END;

ALTER TABLE trading_plans ALTER COLUMN bias SET NOT NULL;
ALTER TABLE trading_plans ALTER COLUMN bias SET DEFAULT 'neutral';
ALTER TABLE trading_plans ADD CONSTRAINT trading_plans_bias_check
  CHECK (bias IN ('bullish', 'bearish', 'neutral'));

-- 2. risks column (text array, same pattern as tags)
ALTER TABLE trading_plans ADD COLUMN risks text[] NOT NULL DEFAULT '{}';

-- 3. Backfill risks from __risks__ sentinel embedded in setups JSONB
UPDATE trading_plans
SET risks = (
  SELECT COALESCE(array_agg(item)::text[], '{}'::text[])
  FROM (
    SELECT jsonb_array_elements_text(elem -> 'items') AS item
    FROM jsonb_array_elements(setups) AS elem
    WHERE elem ->> 'label' = '__risks__'
  ) sub
)
WHERE setups @> '[{"label": "__risks__"}]';

-- 4. Strip __risks__ sentinel from setups JSONB (keep only real setups)
UPDATE trading_plans
SET setups = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements(setups) AS elem
  WHERE elem ->> 'label' != '__risks__'
)
WHERE setups @> '[{"label": "__risks__"}]';
