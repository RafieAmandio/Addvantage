-- Members can opt out of being named/mentioned when their consult is shared to
-- the TradeVantage WhatsApp group. Default true = existing behaviour (named).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "allow_mention" BOOLEAN NOT NULL DEFAULT true;
