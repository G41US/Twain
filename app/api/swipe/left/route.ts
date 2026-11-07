import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Remember a pass so that person doesn't come back.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const { targetId } = await req.json().catch(() => ({}));
  if (typeof targetId !== "string" || targetId === me.id) return new Response("Bad request", { status: 400 });

  await prisma.pass.upsert({
    where: { passerId_passedId: { passerId: me.id, passedId: targetId } },
    create: { passerId: me.id, passedId: targetId },
    update: {},
  });
  return new Response("OK");
}
