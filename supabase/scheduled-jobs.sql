-- Applied 2026-11-07. Re-run on a new Supabase project after deploying the purge-media function
-- (replace the project ref and anon key with that project's).
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Erase storage files queued in "MediaDeletion" (deleted accounts, removed photos).
SELECT cron.schedule('twain-purge-media', '*/15 * * * *', $$
  SELECT net.http_post(
    url := 'https://wnhrkkgsedcaidvwzwfq.supabase.co/functions/v1/purge-media',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <ANON KEY from lib/supabase.ts>'),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000)
$$);

-- The privacy policy promises error logs are kept at most 90 days.
SELECT cron.schedule('twain-daily-cleanup', '17 3 * * *', $$
  DELETE FROM public."ErrorLog" WHERE "createdAt" < now() - interval '90 days';
  DELETE FROM public."UploadTicket" WHERE "expiresAt" < now() - interval '1 day';
$$);
