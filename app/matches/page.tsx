'use client';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type MatchItem = {
  matchId: string;
  user: { id: string; name: string | null; photos: string[]; image: string | null; verified: boolean };
  lastMessage: string | null;
};

export default function Matches() {
  const { status } = useSession();
  const [matches, setMatches] = useState<MatchItem[] | null>(null);

  useEffect(() => {
    if (status === "authenticated") fetch("/api/matches").then((r) => (r.ok ? r.json() : [])).then(setMatches);
  }, [status]);

  if (status === "unauthenticated") return <p className="p-8 text-center">Please <Link href="/" className="text-primary underline">sign in</Link></p>;

  return (
    <main className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-4 text-3xl font-bold">Matches</h1>
      {matches === null && <p className="text-gray-500">Loading…</p>}
      {matches?.length === 0 && <p className="text-gray-500">No matches yet — keep swiping!</p>}
      <ul className="divide-y rounded-2xl bg-white shadow">
        {matches?.map((m) => (
          <li key={m.matchId}>
            <Link href={`/chat/${m.matchId}`} className="flex items-center gap-3 p-4 active:bg-gray-50">
              <img
                src={m.user.photos[0] || m.user.image || "https://placehold.co/96?text=?"}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="font-semibold">{m.user.name}{m.user.verified && <span className="ml-1 text-sky-500" aria-label="Verified">✓</span>}</p>
                <p className="truncate text-sm text-gray-500">{m.lastMessage ?? "Say hi 👋"}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
