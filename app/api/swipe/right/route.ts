import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { targetId } = await req.json().catch(() => ({}));
  if (typeof targetId !== "string" || targetId === session.user.id) return new Response("Invalid target", { status: 400 });

  // Create like (upsert: liking twice is a no-op, not a 500)
  await prisma.like.upsert({
    where: { likerId_likedId: { likerId: session.user.id, likedId: targetId } },
    create: { likerId: session.user.id, likedId: targetId },
    update: {},
  });

  // Check mutual
  const mutual = await prisma.like.findFirst({
    where: { likerId: targetId, likedId: session.user.id },
  });

  if (mutual) {
    await prisma.match.create({
      data: { user1Id: session.user.id, user2Id: targetId },
    });
  }

  return new Response("OK");
}
