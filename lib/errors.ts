import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/push";

const MAX_PER_HOUR = 200; // stops a crash loop or a spammer from filling the table

/** Record an error for the admin page and ping admins. Never throws. */
export async function logError(source: "server" | "client", message: string, path?: string) {
  try {
    const recent = await prisma.errorLog.count({ where: { createdAt: { gte: new Date(Date.now() - 3600_000) } } });
    if (recent >= MAX_PER_HOUR) return;
    await prisma.errorLog.create({ data: { source, message: message.slice(0, 1000), path: path?.slice(0, 300) } });
    await notifyAdmins(`error-${source}`, { title: `Twain ${source} error`, body: message.slice(0, 120), url: "/admin" });
  } catch {
    // logging must never take the app down
  }
}
