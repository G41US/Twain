// Empties the MediaDeletion queue: removes deleted users' and removed photos/voice/selfies from storage.
// Runs every 15 minutes from pg_cron (see supabase/scheduled-jobs.sql). Safe for anyone to trigger: it only processes the queue.
// Deploy: supabase functions deploy purge-media
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BUCKET = "media";

Deno.serve(async () => {
  const { data: rows, error } = await sb.from("MediaDeletion").select("path").order("createdAt").limit(50);
  if (error) return new Response(error.message, { status: 500 });

  let removed = 0;
  const failed: string[] = [];
  for (const { path } of rows ?? []) {
    let paths = [path];
    if (path.endsWith("/")) {
      // A whole folder (account deletion): list what's in it.
      const { data: files, error: listError } = await sb.storage.from(BUCKET).list(path.slice(0, -1), { limit: 1000 });
      if (listError) { failed.push(path); continue; }
      paths = (files ?? []).map((f) => path + f.name);
    }
    if (paths.length) {
      const { error: removeError } = await sb.storage.from(BUCKET).remove(paths);
      if (removeError) { failed.push(path); continue; } // stays queued, retried next run
      removed += paths.length;
    }
    await sb.from("MediaDeletion").delete().eq("path", path);
  }

  return Response.json({ processed: (rows?.length ?? 0) - failed.length, removed, failed });
});
