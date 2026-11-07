import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Delete my account and everything tied to it. Matches, messages, likes, passes, blocks,
// reports and push subscriptions go with the user row (onDelete: Cascade).
export async function DELETE() {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  await prisma.$transaction([
    // Whole folders of this user's uploads; the purge-media job empties them from storage.
    prisma.mediaDeletion.createMany({
      data: ["photo", "voice", "selfie"].map((kind) => ({ path: `${kind}/${me.id}/` })),
      skipDuplicates: true,
    }),
    prisma.uploadTicket.deleteMany({ where: { userId: me.id } }),
    prisma.user.delete({ where: { id: me.id } }),
  ]);

  return new Response("OK");
}
