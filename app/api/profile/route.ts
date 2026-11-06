import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Only these fields can be set by the user; anything else (isAdmin, replyRate, email...) is rejected.
const ProfileInput = z
  .object({
    bio: z.string().max(500),
    age: z.number().int().min(18).max(120),
    gender: z.string().max(50),
    lookingFor: z.string().max(50),
    ethnicity: z.string().max(50).nullable(),
    preferEthnicity: z.string().max(50),
    voiceIntroUrl: z.union([z.string().url(), z.literal("")]),
    vibeAnswers: z.record(z.boolean()),
    dealbreakers: z.array(z.string().max(50)).max(20),
  })
  .partial()
  .strict();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const parsed = ProfileInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json(parsed.error.flatten(), { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  return new Response("OK");
}
