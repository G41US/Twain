import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/push";

// POST { userId, approve }: decide a pending selfie verification.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) return new Response("Forbidden", { status: 403 });

  const { userId, approve } = await req.json().catch(() => ({}));
  if (typeof userId !== "string" || typeof approve !== "boolean") return new Response("Bad request", { status: 400 });

  await prisma.user.update({
    where: { id: userId },
    data: approve ? { verified: true, selfieStatus: null } : { verified: false, selfieStatus: "rejected" },
  });
  await notify([userId], approve
    ? { title: "You're verified ✓", body: "Your profile now shows the verified badge.", url: "/profile" }
    : { title: "Verification not approved", body: "Your selfie didn't match the pose or your photos. Try again.", url: "/profile" });
  return new Response("OK");
}
