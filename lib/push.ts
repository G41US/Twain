import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { VAPID_PUBLIC_KEY } from "@/lib/push-key";

const privateKey = process.env.VAPID_PRIVATE_KEY;
if (privateKey) webpush.setVapidDetails("https://twain-coral.vercel.app", VAPID_PUBLIC_KEY, privateKey);

type Notice = { title: string; body: string; url: string };

/** Send a push to every device of these users. Never throws: a failed notification must not break the request. */
export async function notify(userIds: string[], notice: Notice) {
  if (!privateKey || userIds.length === 0) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  await Promise.all(
    subs.map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(notice), { TTL: 3600 })
        .catch(async (err: { statusCode?: number }) => {
          // 404/410: the browser dropped this subscription (app uninstalled, permission revoked).
          if (err.statusCode === 404 || err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {});
          }
        }),
    ),
  );
}

/** Push to all admins, at most once per 10 minutes per kind, so a crash loop doesn't spam. */
const lastAdminPing = new Map<string, number>();
export async function notifyAdmins(kind: string, notice: Notice) {
  const now = Date.now();
  if (now - (lastAdminPing.get(kind) ?? 0) < 10 * 60_000) return;
  lastAdminPing.set(kind, now);
  const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
  await notify(admins.map((a) => a.id), notice);
}
