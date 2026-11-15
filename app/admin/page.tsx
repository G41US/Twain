import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jakarta } from "../fonts";
import { redirect } from "next/navigation";
import { Avatar, Badge, Panel, PanelHead, pct, when } from "./ui";
import AlertsButton from "./AlertsButton";
import BanButton from "./BanButton";
import VerifyButtons from "./VerifyButtons";

export const dynamic = "force-dynamic";


export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const me = await getCurrentUser();
  if (!me) redirect("/api/auth/signin/google?callbackUrl=/admin");
  if (!me.isAdmin) {
    return (
      <main className={`${jakarta.className} grid min-h-dvh place-items-center bg-[#FAF7FB] p-8 text-center`}>
        <div>
          <p className="text-lg font-bold text-[#140A18]">This page is for Twain admins.</p>
          <p className="mt-1 text-sm text-[#6B6170]">You&apos;re signed in as {me.email}.</p>
        </div>
      </main>
    );
  }

  const dayAgo = new Date(Date.now() - 24 * 3600_000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);
  const [total, activeToday, newThisWeek, matches, messagesToday, avg, reports, pending, newPhotos, newVoices, errors, users] = await Promise.all([
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
    prisma.user.findMany({
      where: { voiceUpdatedAt: { gte: weekAgo }, voiceIntroUrl: { not: null } },
      orderBy: { voiceUpdatedAt: "desc" },
      select: { id: true, name: true, email: true, photos: true, image: true, voiceIntroUrl: true, banned: true, voiceUpdatedAt: true },
      take: 30,
    }),
    prisma.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.user.findMany({
      where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { id: q }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const stats: [string, string | number, string][] = [
    ["Users", total, "All accounts"],
    ["Active today", activeToday, "Last 24 hours"],
    ["New this week", newThisWeek, "Last 7 days"],
    ["Matches", matches, "All time"],
    ["Messages today", messagesToday, "Last 24 hours"],
    ["Avg reply rate", pct(avg._avg.replyRate), "Across all users"],
  ];

  return (
    <div className={`${jakarta.className} min-h-dvh bg-[#FAF7FB] text-[#140A18]`}>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#140A18] text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <span className="text-xl font-extrabold tracking-tight">
            Twain<span className="text-[#FF2D6F]">.</span>
          </span>
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
            Admin
          </span>
          <div className="ml-auto flex items-center gap-3">
            <AlertsButton />
            <span className="hidden text-sm text-white/60 sm:block">{me.name ?? me.email}</span>
            <Avatar src={me.photos[0] ?? me.image} name={me.name} size="h-8 w-8" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-[#6B6170]">{when(new Date())} · Lagos time</p>
        </div>

        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#EDE6F0] bg-[#EDE6F0] sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(([label, value, hint]) => (
            <div key={label} className="bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A8090]">{label}</p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-[#A39AA8]">{hint}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel icon="checkmark-circle" title="Verification requests" count={pending.length} empty="No selfies waiting for review.">
            {pending.map((u) => (
              <div key={u.id} className="p-5">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <a href={`/admin/users/${u.id}`} className="font-bold hover:underline">{u.name ?? "Unnamed"}</a>
                  <p className="text-xs text-[#8A8090]">Pose: <span className="font-semibold text-[#140A18]">{u.selfiePose}</span></p>
                </div>
                <div className="mb-4 flex gap-2 overflow-x-auto">
                  {u.selfieUrl && (
                    <figure className="shrink-0">
                      <img src={u.selfieUrl} alt={`${u.name}'s selfie`} className="h-36 w-28 rounded-xl object-cover ring-2 ring-[#1DA1F2] ring-offset-2" />
                      <figcaption className="mt-1.5 text-center text-[11px] font-semibold text-[#1DA1F2]">Selfie</figcaption>
                    </figure>
                  )}
                  {u.photos.map((p) => <img key={p} src={p} alt="" className="h-36 w-28 shrink-0 rounded-xl object-cover" />)}
                </div>
                <VerifyButtons userId={u.id} />
              </div>
            ))}
          </Panel>

          <Panel icon="flag" title="Reports" count={reports.length} empty="No one has been reported.">
            {reports.map((r) => (
              <div key={r.id} className="flex items-start gap-4 p-5">
                <Avatar src={r.reported.photos[0]} name={r.reported.name} size="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <a href={`/admin/users/${r.reported.id}`} className="block truncate font-bold hover:underline">{r.reported.name ?? "Unnamed"}</a>
                  <p className="truncate text-xs text-[#8A8090]">{r.reported.email}</p>
                  <p className="mt-2 rounded-lg bg-[#FFF1F5] px-3 py-2 text-sm text-[#7A1236]">{r.reason}</p>
                  <p className="mt-2 text-xs text-[#A39AA8]">Reported by {r.reporter.name ?? "someone"} · {when(r.createdAt)}</p>
                </div>
                <BanButton userId={r.reported.id} banned={r.reported.banned} />
              </div>
            ))}
          </Panel>

          <Panel icon="images" title="New photos this week" count={newPhotos.length} empty="No new photos to check.">
            {newPhotos.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <a href={`/admin/users/${u.id}`} className="mb-2 block truncate text-sm font-bold hover:underline">{u.name ?? "Unnamed"}</a>
                  <div className="flex gap-2 overflow-x-auto">
                    {u.photos.map((p) => <img key={p} src={p} alt={`${u.name}'s photo`} className="h-24 w-[4.5rem] shrink-0 rounded-lg object-cover" />)}
                  </div>
                </div>
                {u.id !== me.id && <BanButton userId={u.id} banned={u.banned} />}
              </div>
            ))}
          </Panel>

          <Panel icon="mic" title="New voice intros this week" count={newVoices.length} empty="No new voice intros to check.">
            {newVoices.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-5">
                <Avatar src={u.photos[0] ?? u.image} name={u.name} size="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <a href={`/admin/users/${u.id}`} className="block truncate text-sm font-bold hover:underline">{u.name ?? "Unnamed"}</a>
                  <p className="mb-2 text-xs text-[#A39AA8]">{u.voiceUpdatedAt ? when(u.voiceUpdatedAt) : ""}</p>
                  <audio controls preload="none" src={u.voiceIntroUrl!} className="h-9 w-full" />
                </div>
                {u.id !== me.id && <BanButton userId={u.id} banned={u.banned} />}
              </div>
            ))}
          </Panel>

          <Panel icon="warning" title="Recent errors" count={errors.length} empty="Nothing has gone wrong.">
            {errors.map((e) => (
              <div key={e.id} className="p-5">
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-[#F3EEF6] px-1.5 py-0.5 font-semibold uppercase tracking-wide text-[#6B6170]">{e.source}</span>
                  <span className="font-mono text-[#8A8090]">{e.path}</span>
                  <span className="ml-auto text-[#A39AA8]">{when(e.createdAt)}</span>
                </div>
                <p className="break-words font-mono text-[13px] leading-relaxed">{e.message}</p>
              </div>
            ))}
          </Panel>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#EDE6F0] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1ECF4] pr-5">
            <div className="flex-1 [&>div]:border-b-0"><PanelHead icon="people" title={q ? `Users matching “${q}”` : "Newest users"} count={users.length} /></div>
            <form action="/admin" className="flex gap-2 py-3 pl-5 sm:pl-0">
              <input name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search users"
                className="w-56 rounded-lg border border-[#E4DCE8] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#140A18]" />
              <button className="rounded-lg bg-[#140A18] px-3 py-1.5 text-sm font-semibold text-white">Search</button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A8090]">
                <tr className="border-b border-[#F1ECF4]">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="hidden px-5 py-3 font-semibold sm:table-cell">Joined</th>
                  <th className="hidden px-5 py-3 font-semibold sm:table-cell">Replies</th>
                  <th className="hidden px-5 py-3 font-semibold sm:table-cell">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECF4]">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="w-full px-5 py-3.5 sm:w-auto">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.photos[0] ?? u.image} name={u.name} size="h-9 w-9" />
                        <div className="min-w-0">
                          <a href={`/admin/users/${u.id}`} className="block truncate font-semibold hover:underline">{u.name ?? "Unnamed"}</a>
                          <p className="truncate text-xs text-[#8A8090]">{u.email}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 empty:hidden sm:hidden">
                        {u.isAdmin && <Badge className="bg-[#140A18] text-white">Admin</Badge>}
                        {u.verified && <Badge className="bg-[#E8F5FE] text-[#0B78C2]">Verified</Badge>}
                        {u.banned && <Badge className="bg-[#FDECEC] text-[#B42318]">Banned</Badge>}
                        {!u.acceptedTermsAt && <Badge className="bg-[#F3EEF6] text-[#6B6170]">Setting up</Badge>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-5 py-3.5 text-[#6B6170] sm:table-cell">{when(u.createdAt)}</td>
                    <td className="hidden px-5 py-3.5 tabular-nums text-[#6B6170] sm:table-cell">{pct(u.replyRate)}</td>
                    <td className="hidden px-5 py-3.5 sm:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {u.isAdmin && <Badge className="bg-[#140A18] text-white">Admin</Badge>}
                        {u.verified && <Badge className="bg-[#E8F5FE] text-[#0B78C2]">Verified</Badge>}
                        {u.banned && <Badge className="bg-[#FDECEC] text-[#B42318]">Banned</Badge>}
                        {!u.acceptedTermsAt && <Badge className="bg-[#F3EEF6] text-[#6B6170]">Setting up</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">{u.id !== me.id && <BanButton userId={u.id} banned={u.banned} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
