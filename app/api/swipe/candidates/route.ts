import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      dealbreakers: true,
      preferEthnicity: true,
    },
  });

  if (!currentUser) return new Response("User not found", { status: 404 });

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      age: { gte: 18 },

      // Skip people I've already liked.
      likesReceived: { none: { likerId: currentUser.id } },

      // Ethnicity preference
      ...(currentUser.preferEthnicity && currentUser.preferEthnicity !== "all" && {
        ethnicity: { equals: currentUser.preferEthnicity },
      }),

      // Dealbreakers: exclude anyone who has *any* of the current user's dealbreakers
      ...(currentUser.dealbreakers.length > 0 && {
        NOT: {
          dealbreakers: {
            hasSome: currentUser.dealbreakers,
          },
        },
      }),
    },

    select: {
      id: true,
      name: true,
      age: true,
      bio: true,
      photos: true,
      image: true,
      voiceIntroUrl: true,
      replyRate: true,
      dealbreakers: true,
    },

    take: 50,
  });

  return Response.json(candidates);
}
