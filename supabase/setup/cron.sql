-- Run once in the Supabase SQL editor AFTER deploying the edge functions.
-- Not a migration because it contains secrets. Replace the two placeholders:
--   <PROJECT_REF>  your project ref (Settings → General)
--   <CRON_SECRET>  the same value you set with: supabase secrets set CRON_SECRET=...

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
select vault.create_secret('<CRON_SECRET>', 'cron_secret');

create or replace function call_edge_function(name text) returns void
language sql security definer set search_path = public as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/' || name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
$$;

-- Session generation, auto-absent and alert queueing every 5 minutes.
select cron.schedule('attendance-cron', '*/5 * * * *', $$ select call_edge_function('attendance-cron') $$);
-- WhatsApp sending every 5 minutes (offset by 2 minutes).
select cron.schedule('send-messages', '2-59/5 * * * *', $$ select call_edge_function('send-messages') $$);
