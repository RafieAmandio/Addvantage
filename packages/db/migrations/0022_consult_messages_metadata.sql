-- 0022: add metadata jsonb to consult_messages (token usage, model, latency)
alter table public.consult_messages
  add column if not exists metadata jsonb;

comment on column public.consult_messages.metadata is
  'Per-message metadata — currently { model?, prompt_tokens?, completion_tokens?, total_tokens?, streamed? } for assistant turns. Null for user turns.';
