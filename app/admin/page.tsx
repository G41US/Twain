import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BanButton from "./BanButton";
import VerifyButtons from "./VerifyButtons";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) return <div className="p-8">Access denied.</div>;

  const dayAgo = new Date(Date.now() - 24 * 3600_000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);
  const [total, activeToday, newThisWeek, matches, messagesToday, avg, reports, pending, newPhotos, errors, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastActiveAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.match.count(),
    prisma.message.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.user.aggregate({ _avg: { replyRate: true } }),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reporter: { select: { name: true } },
        reported: { select: { id: true, name: true, email: true, banned: true, photos: true } },
      },
    }),
    prisma.user.findMany({
      where: { selfieStatus: "pending" },
      select: { id: true, name: true, selfieUrl: true, selfiePose: true, photos: true },
      take: 30,
    }),
    prisma.user.findMany({
      where: { photosUpdatedAt: { gte: weekAgo } },
      orderBy: { photosUpdatedAt: "desc" },
      select: { id: true, name: true, email: true, photos: true, banned: true },
      take: 30,
    }),
    prisma.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const stats = [
    ["Users", total],
    ["Active today", activeToday],
    ["New this week", newThisWeek],
    ["Matches", matches],
    ["Messages today", messagesToday],
    ["Avg reply rate", avg._avg.replyRate === null ? "–" : `${Math.round(avg._avg.replyRate)}%`],
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6">
      <h1 className="mb-4 text-3xl font-bold">Admin</h1>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-xl font-bold">Verification requests ({pending.length})</h2>
      {pending.length === 0 && <p className="mb-8 text-gray-500">None waiting.</p>}
      <ul className="mb-8 space-y-3">
        {pending.map((u) => (
          <li key={u.id} className="rounded-2xl bg-white p-4 shadow">
            <p className="font-semibold">{u.name}</p>
            <p className="mb-2 text-sm text-gray-600">Asked to: <b>{u.selfiePose}</b></p>
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {u.selfieUrl && <img src={u.selfieUrl} alt="Selfie" className="h-36 w-28 shrink-0 rounded-lg object-cover ring-4 ring-blue-400" />}
              {u.photos.map((p) => <img key={p} src={p} alt="" className="h-36 w-28 shrink-0 rounded-lg object-cover" />)}
            </div>
            <VerifyButtons userId={u.id} />
          </li>
        ))}
      </ul>

      <h2 className="mb-2 text-xl font-bold">Reports ({reports.length})</h2>
      {reports.length === 0 && <p className="mb-8 text-gray-500">No reports. 🎉</p>}
      <ul className="mb-8 space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow">
            {r.reported.photos[0] && <img src={r.reported.photos[0]} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.reported.name} <span className="font-normal text-gray-500">({r.reported.email})</span></p>
              <p className="text-sm">&ldquo;{r.reason}&rdquo;</p>
              <p className="text-xs text-gray-500">by {r.reporter.name} · {r.createdAt.toLocaleString()}</p>
            </div>
            <BanButton userId={r.reported.id} banned={r.reported.banned} />
          </li>
        ))}
      </ul>

      <h2 className="mb-2 text-xl font-bold">New photos this week ({newPhotos.length})</h2>
      <ul className="mb-8 space-y-2">
        {newPhotos.map((u) => (
          <li key={u.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow">
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {u.photos.map((p) => <img key={p} src={p} alt={`${u.name}'s photo`} className="h-20 w-16 shrink-0 rounded-lg object-cover" />)}
            </div>
            {u.id !== me.id && <BanButton userId={u.id} banned={u.banned} />}
          </li>
        ))}
      </ul>

      <h2 className="mb-2 text-xl font-bold">Recent errors ({errors.length})</h2>
      {errors.length === 0 && <p className="mb-8 text-gray-500">No errors. 🎉</p>}
      <ul className="mb-8 space-y-2">
        {errors.map((e) => (
          <li key={e.id} className="rounded-2xl bg-white p-3 text-sm shadow">
            <p className="font-mono text-xs text-gray-500">{e.createdAt.toLocaleString()} · {e.source} · {e.path}</p>
            <p className="break-words">{e.message}</p>
          </li>
        ))}
      </ul>

      <h2 className="mb-2 text-xl font-bold">Newest users</h2>
      <ul className="space-y-2 pb-4">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{u.name ?? "(no name)"} {u.isAdmin && "👑"} {u.verified && "✓"}</p>
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
