-- Store AI pipeline audit trail so admins can inspect what was sent to and
-- returned from OpenAI for each news item.
ALTER TABLE public.news_items
  ADD COLUMN ai_system_prompt text,
  ADD COLUMN ai_user_message  text,
  ADD COLUMN ai_raw_response  text;

COMMENT ON COLUMN public.news_items.ai_system_prompt IS 'System prompt sent to OpenAI during rephrase';
COMMENT ON COLUMN public.news_items.ai_user_message  IS 'User message sent to OpenAI during rephrase';
COMMENT ON COLUMN public.news_items.ai_raw_response  IS 'Raw JSON string returned by OpenAI before schema parsing';
