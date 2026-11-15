import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UNDO_WINDOW_MS = 10 * 60_000;

// Take back your last like or pass on someone, so they come back to Discover.
// Not once it became a match (that's what Unmatch is for), and only for a few minutes.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const { targetId } = await req.json().catch(() => ({}));
  if (typeof targetId !== "string" || targetId === me.id) return new Response("Bad request", { status: 400 });

  const [a, b] = [me.id, targetId].sort();
  const matched = await prisma.match.findFirst({ where: { user1Id: a, user2Id: b }, select: { id: true } });
  if (matched) return new Response("You've already matched", { status: 409 });

  const since = new Date(Date.now() - UNDO_WINDOW_MS);
  const [likes, passes] = await prisma.$transaction([
    prisma.like.deleteMany({ where: { likerId: me.id, likedId: targetId, createdAt: { gte: since } } }),
    prisma.pass.deleteMany({ where: { passerId: me.id, passedId: targetId, createdAt: { gte: since } } }),
  ]);
  if (likes.count + passes.count === 0) return new Response("Too late to undo", { status: 410 });
  return new Response("OK");
}
