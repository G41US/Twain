import { getCurrentUser } from "@/lib/auth";
import { DEALBREAKERS, ETHNICITIES, INTENTIONS, slug, TRAITS, VIBE_QUESTIONS } from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Icon from "../../../components/Icon";
import { jakarta } from "../../../fonts";
import BanButton from "../../BanButton";
import VerifyButtons from "../../VerifyButtons";
import { Avatar, Badge, PanelHead, pct, when } from "../../ui";

export const dynamic = "force-dynamic";

const label = (list: readonly { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? v;
const group = (v: string) => ETHNICITIES.find((e) => slug(e) === v) ?? v;
const days = (d: Date) => Math.floor((Date.now() - d.getTime()) / 86_400_000);

// Everything about one user, for moderation. Message contents stay private; only counts are shown.
export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/api/auth/signin/google?callbackUrl=/admin");
  if (!me.isAdmin) redirect("/admin");

  const { id } = await params;
  const u = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { likesGiven: true, likesReceived: true, passesGiven: true, passesReceived: true, messages: true, blocksMade: true, blocksReceived: true } },
      reportsReceived: { orderBy: { createdAt: "desc" }, include: { reporter: { select: { id: true, name: true } } } },
      reportsMade: { orderBy: { createdAt: "desc" }, include: { reported: { select: { id: true, name: true } } } },
      matchesAsUser1: { include: { user2: { select: { id: true, name: true, photos: true, image: true } }, _count: { select: { messages: true } } } },
      matchesAsUser2: { include: { user1: { select: { id: true, name: true, photos: true, image: true } }, _count: { select: { messages: true } } } },
    },
  });
  if (!u) notFound();

  const matches = [
    ...u.matchesAsUser1.map((m) => ({ id: m.id, other: m.user2, messages: m._count.messages, at: m.createdAt })),
    ...u.matchesAsUser2.map((m) => ({ id: m.id, other: m.user1, messages: m._count.messages, at: m.createdAt })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  const prompts = Array.isArray(u.prompts) ? (u.prompts as { q: string; a: string }[]) : [];
  const vibes = u.vibeAnswers && typeof u.vibeAnswers === "object" ? Object.entries(u.vibeAnswers as Record<string, boolean>) : [];
  const vibeQ = (k: string) => (/^\d+$/.test(k) ? VIBE_QUESTIONS[Number(k)] ?? k : k);

  const facts: [string, React.ReactNode][] = [
    ["Age", u.age ?? "—"],
    ["Gender", u.gender ?? "—"],
    ["Wants to see", u.lookingFor ?? "—"],
    ["Here for", u.intention ? label(INTENTIONS, u.intention) : "—"],
    ["Ethnic group", u.ethnicity ? group(u.ethnicity) : "—"],
    ["Prefers", u.preferEthnicity === "all" || !u.preferEthnicity ? "Everyone" : group(u.preferEthnicity)],
    ["Age range", `${u.ageMin}–${u.ageMax}`],
    ["Distance", `${u.maxDistanceKm} km`],
    ["Location", u.latitude !== null && u.longitude !== null
      ? <a className="underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${u.latitude},${u.longitude}`}>{u.latitude.toFixed(2)}, {u.longitude.toFixed(2)}</a>
      : "—"],
    ["Reply rate", pct(u.replyRate)],
    ["Joined", `${when(u.createdAt)} (${days(u.createdAt)}d ago)`],
    ["Last active", u.lastActiveAt ? when(u.lastActiveAt) : "—"],
    ["Accepted terms", u.acceptedTermsAt ? when(u.acceptedTermsAt) : "Not yet"],
    ["User ID", <span key="id" className="font-mono text-xs">{u.id}</span>],
  ];
  const activity: [string, number][] = [
    ["Likes given", u._count.likesGiven], ["Likes received", u._count.likesReceived],
    ["Passes given", u._count.passesGiven], ["Passed by", u._count.passesReceived],
    ["Matches", matches.length], ["Messages sent", u._count.messages],
    ["Blocked others", u._count.blocksMade], ["Blocked by", u._count.blocksReceived],
  ];

  return (
    <div className={`${jakarta.className} min-h-dvh bg-[#FAF7FB] text-[#140A18]`}>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#140A18] text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <a href="/admin" className="flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white">
            <Icon name="chevron-back" className="h-4 w-4" /> Overview
          </a>
          <span className="ml-auto text-xl font-extrabold tracking-tight">Twain<span className="text-[#FF2D6F]">.</span></span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-8">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar src={u.photos[0] ?? u.image} name={u.name} size="h-20 w-20" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{u.name ?? "Unnamed"}</h1>
            <p className="truncate text-sm text-[#6B6170]">{u.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {u.isAdmin && <Badge className="bg-[#140A18] text-white">Admin</Badge>}
              {u.verified && <Badge className="bg-[#E8F5FE] text-[#0B78C2]">Verified</Badge>}
              {u.selfieStatus === "pending" && <Badge className="bg-[#FFF4E5] text-[#B54708]">Verification pending</Badge>}
              {u.banned && <Badge className="bg-[#FDECEC] text-[#B42318]">Banned</Badge>}
              {!u.acceptedTermsAt && <Badge className="bg-[#F3EEF6] text-[#6B6170]">Setting up</Badge>}
              {u.reportsReceived.length > 0 && <Badge className="bg-[#FFF1F5] text-[#7A1236]">Reported {u.reportsReceived.length}×</Badge>}
            </div>
          </div>
          {u.id !== me.id && <BanButton userId={u.id} banned={u.banned} />}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <Card icon="images" title="Photos" count={u.photos.length}>
              {u.photos.length ? (
                <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                  {u.photos.map((p, i) => (
                    <a key={p} href={p} target="_blank" rel="noreferrer" className="group relative block">
                      <img src={p} alt={`Photo ${i + 1}`} className="aspect-[3/4] w-full rounded-xl object-cover" />
                      <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">{i === 0 ? "Main" : i + 1}</span>
                    </a>
                  ))}
                </div>
              ) : <Empty>No photos.</Empty>}
              {u.photosUpdatedAt && <p className="px-5 pb-4 text-xs text-[#A39AA8]">Last changed {when(u.photosUpdatedAt)}</p>}
            </Card>

            {(u.selfieUrl || u.selfieStatus) && (
              <Card icon="checkmark-circle" title="Verification selfie">
                <div className="flex flex-wrap items-start gap-5 p-5">
                  {u.selfieUrl && (
                    <a href={u.selfieUrl} target="_blank" rel="noreferrer">
                      <img src={u.selfieUrl} alt="Verification selfie" className="h-48 w-36 rounded-xl object-cover ring-2 ring-[#1DA1F2] ring-offset-2" />
                    </a>
                  )}
                  <div className="space-y-2 text-sm">
                    <p>Pose asked: <span className="font-semibold">{u.selfiePose ?? "—"}</span></p>
                    <p>Status: <span className="font-semibold">{u.verified ? "Verified" : u.selfieStatus ?? "—"}</span></p>
                    {u.selfieStatus === "pending" && <VerifyButtons userId={u.id} />}
                  </div>
                </div>
              </Card>
            )}

            <Card icon="person" title="About">
              <div className="space-y-5 p-5 text-sm">
                {u.voiceIntroUrl ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-[#8A8090]">Voice intro {u.voiceUpdatedAt ? `· ${when(u.voiceUpdatedAt)}` : ""}</p>
                    <audio controls preload="none" src={u.voiceIntroUrl} className="h-10 w-full" />
                  </div>
                ) : null}
                <div>
                  <p className="mb-1 text-xs font-semibold text-[#8A8090]">Bio</p>
                  <p className="whitespace-pre-wrap">{u.bio || "—"}</p>
                </div>
                {prompts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#8A8090]">Prompts</p>
                    {prompts.map((p) => (
                      <div key={p.q} className="rounded-lg border-l-2 border-[#FF2D6F] bg-[#FAF7FB] px-3 py-2">
                        <p className="text-xs text-[#8A8090]">{p.q}</p>
                        <p>{p.a}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Tags title="Lifestyle" items={u.traits.map((t) => label(TRAITS, t))} />
                  <Tags title="Dealbreakers" items={u.dealbreakers.map((t) => label(DEALBREAKERS, t))} />
                </div>
                {vibes.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-[#8A8090]">Vibe check</p>
                    <ul className="divide-y divide-[#F1ECF4]">
                      {vibes.map(([k, v]) => (
                        <li key={k} className="flex justify-between gap-4 py-1.5">
                          <span>{vibeQ(k)}</span><span className={`font-semibold ${v ? "text-[#067647]" : "text-[#B42318]"}`}>{v ? "Agree" : "Disagree"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            <Card icon="flag" title="Reports about them" count={u.reportsReceived.length}>
              {u.reportsReceived.length ? (
                <ul className="divide-y divide-[#F1ECF4]">
                  {u.reportsReceived.map((r) => (
                    <li key={r.id} className="p-5 text-sm">
                      <p className="rounded-lg bg-[#FFF1F5] px-3 py-2 text-[#7A1236]">{r.reason}</p>
                      <p className="mt-2 text-xs text-[#A39AA8]">
                        By <a href={`/admin/users/${r.reporter.id}`} className="underline">{r.reporter.name ?? "someone"}</a> · {when(r.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : <Empty>No reports.</Empty>}
            </Card>

            {u.reportsMade.length > 0 && (
              <Card icon="flag" title="Reports they made" count={u.reportsMade.length}>
                <ul className="divide-y divide-[#F1ECF4]">
                  {u.reportsMade.map((r) => (
                    <li key={r.id} className="p-5 text-sm">
                      <p>{r.reason}</p>
                      <p className="mt-1 text-xs text-[#A39AA8]">
                        About <a href={`/admin/users/${r.reported.id}`} className="underline">{r.reported.name ?? "someone"}</a> · {when(r.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card icon="person" title="Profile">
              <dl className="divide-y divide-[#F1ECF4] text-sm">
                {facts.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-5 py-2.5">
                    <dt className="text-[#8A8090]">{k}</dt><dd className="min-w-0 truncate text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card icon="flame" title="Activity">
              <dl className="grid grid-cols-2 gap-px bg-[#F1ECF4]">
                {activity.map(([k, v]) => (
                  <div key={k} className="bg-white px-5 py-3">
                    <dd className="text-xl font-extrabold tabular-nums">{v}</dd><dt className="text-xs text-[#8A8090]">{k}</dt>
                  </div>
                ))}
              </dl>
            </Card>

            <Card icon="chatbubbles" title="Matches" count={matches.length}>
              {matches.length ? (
                <ul className="divide-y divide-[#F1ECF4]">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <a href={`/admin/users/${m.other.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAF7FB]">
                        <Avatar src={m.other.photos[0] ?? m.other.image} name={m.other.name} size="h-9 w-9" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{m.other.name ?? "Unnamed"}</p>
                          <p className="text-xs text-[#A39AA8]">{when(m.at)}</p>
                        </div>
                        <span className="text-xs tabular-nums text-[#6B6170]">{m.messages} msgs</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : <Empty>No matches yet.</Empty>}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({ icon, title, count, children }: { icon: Parameters<typeof PanelHead>[0]["icon"]; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#EDE6F0] bg-white">
      {count === undefined ? (
        <div className="flex items-center gap-2.5 border-b border-[#F1ECF4] px-5 py-4">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F3EEF6]"><Icon name={icon} className="h-4 w-4" /></span>
          <h2 className="font-bold">{title}</h2>
        </div>
      ) : <PanelHead icon={icon} title={title} count={count} />}
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-[#A39AA8]">{children}</p>;
}

function Tags({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-[#8A8090]">{title}</p>
      {items.length ? (
        <div className="flex flex-wrap gap-1.5">{items.map((t) => <span key={t} className="rounded-full bg-[#F3EEF6] px-2.5 py-1 text-xs font-medium">{t}</span>)}</div>
      ) : <p className="text-[#A39AA8]">None</p>}
    </div>
  );
}
