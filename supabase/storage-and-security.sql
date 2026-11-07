-- Applied to the Supabase project on 2026-11-06 (tables themselves come from `npm run db:push`).
-- Re-run this on a new Supabase project after `db:push`.

-- The anon key ships in the app, so the public API roles get no access to app tables.
-- (The app connects as the database owner via Prisma, which bypasses all of this.)
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Block" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UploadTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pass" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaDeletion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ErrorLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Account", "User", "Like", "Match", "Message", "Block", "Report", "UploadTicket",
  "Pass", "PushSubscription", "MediaDeletion", "ErrorLog" FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- Public bucket for profile photos and voice intros (4MB max, images/audio only).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 4194304, ARRAY[
  'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
  'audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/aac','audio/wav','audio/x-m4a'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Uploads only succeed for a path the app issued a fresh ticket for (POST /api/upload).
-- Kept in a schema the REST API doesn't expose.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
CREATE OR REPLACE FUNCTION private.has_upload_ticket(object_path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."UploadTicket" t
    WHERE t.path = object_path AND t."expiresAt" > (now() AT TIME ZONE 'utc')
  );
$$;
REVOKE ALL ON FUNCTION private.has_upload_ticket(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_upload_ticket(text) TO anon, authenticated;

DROP POLICY IF EXISTS "twain upload with ticket" ON storage.objects;
CREATE POLICY "twain upload with ticket" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'media' AND private.has_upload_ticket(name));
