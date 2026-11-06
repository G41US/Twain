import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { genderFilter, vibeScore } from "@/lib/matching";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  if (!me.gender || !me.lookingFor) return new Response("Complete your profile first", { status: 409 });

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      age: { gte: 18 },
      banned: false,
      ...genderFilter(me),

      // Skip people I've already liked, and anyone blocked in either direction.
      likesReceived: { none: { likerId: me.id } },
      blocksMade: { none: { blockedId: me.id } },
      blocksReceived: { none: { blockerId: me.id } },

      ...(me.preferEthnicity && me.preferEthnicity !== "all" && { ethnicity: me.preferEthnicity }),

      // Dealbreakers: exclude anyone who has *any* of my dealbreakers
      ...(me.dealbreakers.length > 0 && { NOT: { dealbreakers: { hasSome: me.dealbreakers } } }),
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
      vibeAnswers: true,
    },
    take: 50,
  });

  return Response.json(
    candidates.map(({ vibeAnswers, ...c }) => ({
      ...c,
      vibe: vibeScore(me.vibeAnswers as Record<string, boolean>, vibeAnswers as Record<string, boolean>),
    })),
  );
}
