import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase";

/**
 * Tells both phones in a chat that something changed ("msg" or "read"), over Supabase Realtime.
 * Carries no content: the app refetches through the normal, authorised API. Never throws.
 */
export async function ping(matchId: string, event: "msg" | "read") {
  await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ topic: `match:${matchId}`, event, payload: {} }] }),
  }).catch(() => {});
}
