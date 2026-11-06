import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) return new Response("Forbidden", { status: 403 });

  const { userId, banned } = await req.json().catch(() => ({}));
  if (typeof userId !== "string" || typeof banned !== "boolean" || userId === me.id) {
    return new Response("Bad request", { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { banned } });
  return new Response("OK");
}
