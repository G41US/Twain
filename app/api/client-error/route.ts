import { logError } from "@/lib/errors";

// Screens report crashes here (see app/error.tsx). Open to signed-out users; logError caps volume.
export async function POST(req: Request) {
  const { message, path } = await req.json().catch(() => ({}));
  if (typeof message !== "string" || !message) return new Response("Bad request", { status: 400 });
  await logError("client", message, typeof path === "string" ? path : undefined);
  return new Response("OK");
}
