import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUCKET, SUPABASE_URL } from "@/lib/supabase";
import { POSES } from "@/lib/options";
import { notifyAdmins } from "@/lib/push";

// GET: hand out a random pose to copy (stored, so the user can't pick an easy one or reuse an old photo).
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const pose = POSES[Math.floor(Math.random() * POSES.length)];
  await prisma.user.update({ where: { id: me.id }, data: { selfiePose: pose } });
  return Response.json({ pose });
}

// POST { selfieUrl }: submit the selfie for an admin to compare with the profile photos.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  if (!me.selfiePose) return new Response("Get a pose first", { status: 409 });

  const { selfieUrl } = await req.json().catch(() => ({}));
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/selfie/${me.id}/`;
  if (typeof selfieUrl !== "string" || !selfieUrl.startsWith(prefix) || selfieUrl.length > 300) {
    return new Response("Bad selfie", { status: 400 });
  }

  await prisma.user.update({ where: { id: me.id }, data: { selfieUrl, selfieStatus: "pending" } });
  await notifyAdmins("verify", { title: "Selfie to review", body: `${me.name ?? "Someone"} asked to be verified.`, url: "/admin" });
  return new Response("OK");
}
