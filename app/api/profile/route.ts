import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Only fields a user may edit about themselves. Anything else (isAdmin, email, replyRate...) is rejected.
const Profile = z.strictObject({
  name: z.string().trim().min(1).max(60),
  age: z.number().int().min(18).max(120),
  bio: z.string().max(500).nullable(),
  gender: z.string().max(50).nullable(),
  lookingFor: z.string().max(50).nullable(),
  ethnicity: z.string().max(50).nullable(),
  preferEthnicity: z.string().max(50),
  photos: z.array(z.string().url().startsWith("https://")).max(9),
  voiceIntroUrl: z.union([z.literal(""), z.string().url().startsWith("https://")]),
  dealbreakers: z.array(z.string().max(50)).max(20),
  vibeAnswers: z.record(z.string().max(100), z.boolean()),
}).partial();

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const parsed = Profile.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Invalid profile", { status: 400 });

  await prisma.user.update({
    where: { email: session.user.email },
    data: parsed.data,
  });

  return new Response("OK");
}
