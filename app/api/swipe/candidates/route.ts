import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, preferEthnicity: true, dealbreakers: true, vibeAnswers: true },
  });

  const candidates = await prisma.user.findMany({
    where: {
  id: { not: currentUser!.id },
  age: { gte: 18 },
  photos: { not: { equals: [] } },                // fixed
  ethnicity: currentUser!.preferEthnicity === "all" 
    ? undefined 
    : currentUser!.preferEthnicity,
  AND: currentUser!.dealbreakers.length > 0
    ? [
        {
          NOT: {
            dealbreakers: { hasSome: currentUser!.dealbreakers }
          }
        }
      ]
    : [],
},
    select: {
      id: true, name: true, age: true, bio: true, photos: true, voiceIntroUrl: true,
      replyRate: true, dealbreakers: true, vibeAnswers: true,
    },
    take: 20,
  });

  return Response.json(candidates);
}
