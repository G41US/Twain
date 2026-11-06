import { createClient } from "@supabase/supabase-js";

// Public by design (the anon key only has the rights our database rules give it), so it's fine in code.
// Override with env vars if you move to another Supabase project.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wnhrkkgsedcaidvwzwfq.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduaHJra2dzZWRjYWlkdnd6d2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTY0MDMsImV4cCI6MjA3OTU5MjQwM30.dL7Epg9HEkNQq3cOkmc9Z8te6CvNPQ_8M46-HS2ENQs";

export const BUCKET = "media";

/**
 * Upload a photo or voice clip. Our API issues a one-time ticket for a random path,
 * and a storage rule in Supabase only accepts uploads to paths with a valid ticket.
 * Returns the public URL, or throws.
 */
export async function uploadFile(kind: "photo" | "voice", file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType: file.type }),
  });
  if (!res.ok) throw new Error(await res.text());
  const { path, publicUrl } = await res.json();

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return publicUrl;
}
