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
  photos: { isEmpty: false },
  ethnicity:
    currentUser!.preferEthnicity === "all"
      ? undefined
      : { equals: currentUser!.preferEthnicity },
}

    ...(currentUser!.dealbreakers.length > 0 && {
      NOT: {
        dealbreakers: {
          hasSome: currentUser!.dealbreakers
        }
      }
    })
  },
  select: {
    id: true,
    name: true,
    age: true,
    bio: true,
    photos: true,
    voiceIntroUrl: true,
    replyRate: true,
    dealbreakers: true,
  },
  take: 50,
});

  return Response.json(candidates);
}
