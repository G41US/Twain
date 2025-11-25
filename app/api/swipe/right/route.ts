import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { targetId } = await req.json();

  // Create like
  await prisma.like.create({
    data: { likerId: session.user.id, likedId: targetId },
  });

  // Check for mutual like
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
