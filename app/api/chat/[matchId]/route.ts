import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcReplyRate } from "@/lib/matching";

const MESSAGES_PER_MINUTE = 30;

type Ctx = { params: Promise<{ matchId: string }> };

// The match, only if I'm in it.
async function myMatch(matchId: string, meId: string) {
  return prisma.match.findFirst({
    where: { id: matchId, OR: [{ user1Id: meId }, { user2Id: meId }] },
    include: {
      user1: { select: { id: true, name: true, photos: true, image: true } },
      user2: { select: { id: true, name: true, photos: true, image: true } },
    },
  });
}

async function updateReplyRate(userId: string) {
  const matches = await prisma.match.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    select: { messages: { select: { senderId: true }, orderBy: { createdAt: "asc" } } },
  });
  const rate = calcReplyRate(userId, matches.map((m) => m.messages.map((x) => x.senderId)));
  await prisma.user.update({ where: { id: userId }, data: { replyRate: rate } });
}

export async function GET(_req: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const match = await myMatch((await params).matchId, me.id);
  if (!match) return new Response("Not found", { status: 404 });

  const messages = await prisma.message.findMany({
    where: { matchId: match.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return Response.json({
    me: me.id,
    other: match.user1Id === me.id ? match.user2 : match.user1,
    messages,
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const match = await myMatch((await params).matchId, me.id);
  if (!match) return new Response("Not found", { status: 404 });

  const { body } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim() : "";
  if (!text || text.length > 1000) return new Response("Message must be 1–1000 characters", { status: 400 });

  const recent = await prisma.message.count({
    where: { senderId: me.id, createdAt: { gte: new Date(Date.now() - 60_000) } },
  });
  if (recent >= MESSAGES_PER_MINUTE) return new Response("Slow down", { status: 429 });

  const message = await prisma.message.create({
    data: { matchId: match.id, senderId: me.id, body: text },
  });

  // A new message can change both people's reply rate.
  await Promise.all([updateReplyRate(match.user1Id), updateReplyRate(match.user2Id)]);

  return Response.json(message);
}
