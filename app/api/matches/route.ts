import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const person = { select: { id: true, name: true, bio: true, photos: true, image: true, verified: true } };

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const matches = await prisma.match.findMany({
    where: { OR: [{ user1Id: me.id }, { user2Id: me.id }] },
    include: {
      user1: person,
      user2: person,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(
    matches.map((m) => ({
      matchId: m.id,
      user: m.user1Id === me.id ? m.user2 : m.user1,
      lastMessage: m.messages[0]?.body ?? null,
    })),
  );
}
