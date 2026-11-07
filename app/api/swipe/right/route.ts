import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/push";

const LIKES_PER_HOUR = 100;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const me = user.id;
  const { targetId } = await req.json().catch(() => ({}));
  if (typeof targetId !== "string" || targetId === me) {
    return new Response("Bad request", { status: 400 });
  }

  const recent = await prisma.like.count({
    where: { likerId: me, createdAt: { gte: new Date(Date.now() - 3600_000) } },
  });
  if (recent >= LIKES_PER_HOUR) return new Response("Slow down — try again later", { status: 429 });

  // upsert: liking the same person twice is a no-op instead of a crash
  await prisma.like.upsert({
    where: { likerId_likedId: { likerId: me, likedId: targetId } },
    create: { likerId: me, likedId: targetId },
    update: {},
  });

  const mutual = await prisma.like.findUnique({
    where: { likerId_likedId: { likerId: targetId, likedId: me } },
  });

  if (!mutual) return Response.json({ matchId: null });

  // Sorted ids so A+B and B+A are the same match row.
  const [user1Id, user2Id] = [me, targetId].sort();
  // create fails on the unique pair if the match already exists (or both swiped at the same moment).
  const created = await prisma.match.create({ data: { user1Id, user2Id } }).catch(() => null);
  const match = created ?? (await prisma.match.findUniqueOrThrow({ where: { user1Id_user2Id: { user1Id, user2Id } } }));
  // The other person liked first, so they don't know yet — tell them.
  if (created) {
    await notify([targetId], { title: "It's a match! 🎉", body: `You and ${user.name ?? "someone"} like each other.`, url: `/chat/${match.id}` });
  }
  return Response.json({ matchId: match.id });
}
