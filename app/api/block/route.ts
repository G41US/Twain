import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const { targetId } = await req.json().catch(() => ({}));
  if (typeof targetId !== "string" || targetId === me.id) return new Response("Bad request", { status: 400 });

  const [user1Id, user2Id] = [me.id, targetId].sort();
  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: me.id, blockedId: targetId } },
      create: { blockerId: me.id, blockedId: targetId },
      update: {},
    }),
    // Unmatch too, which deletes the chat for both sides.
    prisma.match.deleteMany({ where: { user1Id, user2Id } }),
  ]);

  return new Response("OK");
}
