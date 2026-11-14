import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Save this device's push subscription for the signed-in user:
// { expoToken } from the native app, or a web PushSubscription from the website.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const sub = await req.json().catch(() => null);
  if (typeof sub?.expoToken === "string") {
    const token = sub.expoToken;
    if (!/^Expo(nent)?PushToken\[[\w-]{10,100}\]$/.test(token)) return new Response("Bad token", { status: 400 });
    await prisma.pushSubscription.upsert({
      where: { endpoint: token },
      create: { endpoint: token, p256dh: "", auth: "", userId: me.id },
      update: { userId: me.id },
    });
    return new Response("OK");
  }

  const endpoint = sub?.endpoint, p256dh = sub?.keys?.p256dh, auth = sub?.keys?.auth;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 1000 ||
      typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) {
    return new Response("Bad subscription", { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, userId: me.id },
    update: { p256dh, auth, userId: me.id },
  });
  return new Response("OK");
}
