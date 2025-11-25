import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const matches = await prisma.match.findMany({
    where: { OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }] },
    include: {
      user1: { select: { id: true, name: true, bio: true, photos: true } },
      user2: { select: { id: true, name: true, bio: true, photos: true } },
    },
  });

  return Response.json(matches.map(m => m.user1Id === session.user.id ? m.user2 : m.user1));
}
