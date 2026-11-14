import { File } from "expo-file-system";
import { Platform } from "react-native";
import { API_URL, DEMO_EMAIL } from "./config";
import { supabase } from "./supabase";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function token() {
  if (DEMO_EMAIL) return `demo:${DEMO_EMAIL}`;
  return (await supabase.auth.getSession()).data.session?.access_token ?? "";
}

/** Call the Twain API as the signed-in user. Throws ApiError with the server's message on failure. */
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(API_URL + path, {
    method: opts.method ?? (opts.body === undefined ? "GET" : "POST"),
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  if (!res.ok) throw new ApiError(res.status, text || res.statusText);
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

/**
 * Upload a photo, selfie or voice clip. The API hands out a one-time ticket for a random path;
 * Supabase Storage only accepts uploads to ticketed paths. Returns the public URL.
 */
export async function uploadFile(kind: "photo" | "selfie" | "voice", uri: string, contentType: string): Promise<string> {
  const { path, publicUrl } = await api<{ path: string; publicUrl: string }>("/api/upload", { body: { kind, contentType } });
  const bytes = Platform.OS === "web" ? await (await fetch(uri)).arrayBuffer() : await new File(uri).arrayBuffer();
  const { error } = await supabase.storage.from("media").upload(path, bytes, { contentType });
  if (error) throw error;
  return publicUrl;
}

/** Best guess at a file's type from the picker/recorder (Android often omits mimeType). */
export function mimeFor(uri: string, given?: string | null, fallback = "image/jpeg") {
  if (given) return given;
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic",
    m4a: "audio/mp4", mp4: "audio/mp4", aac: "audio/aac", webm: "audio/webm", ogg: "audio/ogg", wav: "audio/wav", mp3: "audio/mpeg",
  };
  return (ext && map[ext]) || fallback;
}
