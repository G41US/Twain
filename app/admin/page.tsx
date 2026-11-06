import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BanButton from "./BanButton";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) return <div className="p-8">Access denied.</div>;

  const dayAgo = new Date(Date.now() - 24 * 3600_000);
  const [total, activeToday, matches, avg, reports, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastActiveAt: { gte: dayAgo } } }),
    prisma.match.count(),
    prisma.user.aggregate({ _avg: { replyRate: true } }),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reporter: { select: { name: true } },
        reported: { select: { id: true, name: true, email: true, banned: true } },
      },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const stats = [
    ["Users", total],
    ["Active today", activeToday],
    ["Matches", matches],
    ["Avg reply rate", avg._avg.replyRate === null ? "–" : `${Math.round(avg._avg.replyRate)}%`],
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6">
      <h1 className="mb-4 text-3xl font-bold">Admin</h1>

      <div className="mb-8 grid grid-cols-2 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-xl font-bold">Reports ({reports.length})</h2>
      {reports.length === 0 && <p className="mb-8 text-gray-500">No reports. 🎉</p>}
      <ul className="mb-8 space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.reported.name} <span className="font-normal text-gray-500">({r.reported.email})</span></p>
              <p className="text-sm">&ldquo;{r.reason}&rdquo;</p>
              <p className="text-xs text-gray-500">by {r.reporter.name} · {r.createdAt.toLocaleString()}</p>
            </div>
            <BanButton userId={r.reported.id} banned={r.reported.banned} />
          </li>
        ))}
      </ul>

      <h2 className="mb-2 text-xl font-bold">Newest users</h2>
      <ul className="space-y-2 pb-4">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{u.name ?? "(no name)"} {u.isAdmin && "👑"}</p>
              <p className="truncate text-sm text-gray-500">{u.email}</p>
              <p className="text-xs text-gray-500">Replies: {u.replyRate === null ? "–" : `${Math.round(u.replyRate)}%`}</p>
            </div>
            {u.id !== me.id && <BanButton userId={u.id} banned={u.banned} />}
          </li>
        ))}
      </ul>
    </main>
  );
}
