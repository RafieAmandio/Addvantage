-- 0041_affiliate_urls.sql
-- Point the Exness and Bitget referral partners at the real affiliate links
-- (0032 seeded placeholder homepage URLs) and set which partners are shown:
-- Bitget + Exness active, Bybit hidden. Idempotent — safe to re-run.

update public.referral_partners
  set url = 'https://one.exnessonelink.com/a/ln6atwo69p', active = true
  where name = 'Exness';

update public.referral_partners
  set url = 'https://partner.bitget.com/bg/TVantage', active = true
  where name = 'Bitget';

update public.referral_partners
  set active = false
  where name = 'Bybit';
