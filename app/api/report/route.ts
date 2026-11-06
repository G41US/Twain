import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const { targetId, reason } = await req.json().catch(() => ({}));
  const text = typeof reason === "string" ? reason.trim() : "";
  if (typeof targetId !== "string" || targetId === me.id || !text || text.length > 500) {
    return new Response("Bad request", { status: 400 });
  }

  const reported = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!reported) return new Response("Not found", { status: 404 });

  await prisma.report.create({ data: { reporterId: me.id, reportedId: targetId, reason: text } });
  return new Response("OK");
}
