-- Daily refresh of every connected source (optional). Run after the functions are deployed.
-- Requires the pg_cron and pg_net extensions (Database > Extensions). Replace the placeholders.
-- Keep the secret in Supabase Vault or an environment-managed place rather than in this file.
-- For many clients, call the function once per client instead of once for all, to stay inside the
-- edge function time limit.

select cron.schedule(
  'fs42-daily-sync',
  '15 6 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT-REF>.supabase.co/functions/v1/sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{"all": true, "days": 7}'::jsonb
  );
  $$
);
