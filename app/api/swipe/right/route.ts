import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const me = session.user.id;
  const { targetId } = await req.json().catch(() => ({}));
  if (typeof targetId !== "string" || targetId === me) {
    return new Response("Bad request", { status: 400 });
  }

  // upsert: liking the same person twice is a no-op instead of a crash
  await prisma.like.upsert({
    where: { likerId_likedId: { likerId: me, likedId: targetId } },
    create: { likerId: me, likedId: targetId },
    update: {},
  });

  const mutual = await prisma.like.findUnique({
    where: { likerId_likedId: { likerId: targetId, likedId: me } },
  });

  if (mutual) {
    // Sorted ids so A+B and B+A are the same match row.
    const [user1Id, user2Id] = [me, targetId].sort();
    await prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      create: { user1Id, user2Id },
      update: {},
    });
  }

  return Response.json({ matched: Boolean(mutual) });
}
