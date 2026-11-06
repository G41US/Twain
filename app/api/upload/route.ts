import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUCKET, SUPABASE_URL } from "@/lib/supabase";

const TICKET_MINUTES = 10;
const TICKETS_PER_HOUR = 40;
const allowed: Record<string, RegExp> = { photo: /^image\/(jpeg|png|webp|gif|heic|heif)$/, voice: /^audio\/(webm|ogg|mp4|mpeg|aac|wav|x-m4a)$/ };

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const { kind, contentType } = await req.json().catch(() => ({}));
  if (typeof kind !== "string" || !allowed[kind] || typeof contentType !== "string" || !allowed[kind].test(contentType)) {
    return new Response("Unsupported file type", { status: 400 });
  }

  const recent = await prisma.uploadTicket.count({
    where: { userId: me.id, expiresAt: { gte: new Date(Date.now() - 3600_000) } },
  });
  if (recent >= TICKETS_PER_HOUR) return new Response("Too many uploads — try again later", { status: 429 });

  const ext = contentType.split("/")[1].replace("x-", "").replace("mpeg", "mp3");
  const path = `${kind}/${me.id}/${randomUUID()}.${ext}`;
  await prisma.uploadTicket.create({
    data: { path, userId: me.id, expiresAt: new Date(Date.now() + TICKET_MINUTES * 60_000) },
  });

  return Response.json({ path, publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}` });
}
