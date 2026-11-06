'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Profile = {
  id: string;
  name: string | null;
  age?: number;
  bio?: string | null;
  photos?: string[];
  image?: string | null;
  voiceIntroUrl?: string | null;
  replyRate: number | null;
  vibe: number | null;
  dealbreakers?: string[];
};

const SWIPE_DISTANCE = 100; // px of drag that counts as a swipe

export default function Swipe() {
  const { status } = useSession();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dx, setDx] = useState(0);
  const [match, setMatch] = useState<{ matchId: string; name: string | null } | null>(null);
  const [playing, setPlaying] = useState(false);
  const dragStart = useRef<number | null>(null);
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/swipe/candidates").then(async (r) => {
      if (r.status === 409) return setNeedsProfile(true);
      setProfiles(r.ok ? await r.json() : []);
    });
  }, [status]);

  const profile = profiles?.[current];

  const next = () => {
    setDx(0);
    setPlaying(false);
    setCurrent((c) => c + 1);
  };

  // shortcut: passes aren't stored, so passed profiles return next visit; add a Pass model if that matters.
  const swipe = async (direction: "left" | "right") => {
    if (!profile) return;
    setDx(direction === "right" ? 600 : -600); // fly off screen
    if (direction === "right") {
      const res = await fetch("/api/swipe/right", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: profile.id }),
      });
      if (res.status === 429) {
        setDx(0);
        return alert("You've liked a lot of people this hour. Take a break and come back soon!");
      }
      const { matchId } = await res.json().catch(() => ({}));
      if (matchId) setMatch({ matchId, name: profile.name });
    }
    setTimeout(next, 200);
  };

  const report = async () => {
    if (!profile) return;
    const reason = prompt(`Why are you reporting ${profile.name ?? "this person"}?`);
    if (!reason?.trim()) return;
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: profile.id, reason }),
    });
    alert("Thanks — our team will review this profile.");
    next();
  };

  const toggleVoice = () => {
    if (!audio.current) return;
    if (playing) audio.current.pause();
    else audio.current.play();
    setPlaying(!playing);
  };

  if (status === "unauthenticated") return <Centered>Please <Link href="/" className="text-primary underline">sign in</Link></Centered>;
  if (needsProfile)
    return (
      <Centered>
        <p className="mb-4">Tell us who you are and who you&apos;re looking for first.</p>
        <Link href="/profile" className="rounded-full bg-primary px-6 py-3 font-semibold text-white">Complete profile</Link>
      </Centered>
    );
  if (!profiles) return <Centered>Finding people…</Centered>;
  if (!profile) return <Centered>No more profiles right now 😢<br />Check back later.</Centered>;

  const photo = profile.photos?.[0] || profile.image || "https://placehold.co/384x600?text=No+Photo";
  const rotate = dx / 20;

  return (
    // overflow-x-clip: a card flying off-screen must not widen the page, or mobile browsers zoom out
    // and the full-screen match popup ends up centered off to the side.
    <main className="mx-auto flex max-w-md flex-col items-center overflow-x-clip px-4 pt-4">
      <div
        className="relative h-[min(68dvh,600px)] w-full touch-none select-none overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{
          transform: `translateX(${dx}px) rotate(${rotate}deg)`,
          transition: dragStart.current === null ? "transform 0.2s" : "none",
        }}
        onPointerDown={(e) => {
          dragStart.current = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => dragStart.current !== null && setDx(e.clientX - dragStart.current)}
        onPointerUp={() => {
          dragStart.current = null;
          if (dx > SWIPE_DISTANCE) swipe("right");
          else if (dx < -SWIPE_DISTANCE) swipe("left");
          else setDx(0);
        }}
      >
        <img src={photo} alt={profile.name ?? "Profile photo"} draggable={false} className="h-full w-full object-cover" />

        {dx > 30 && <Stamp className="left-5 rotate-[-15deg] border-green-500 text-green-500">LIKE</Stamp>}
        {dx < -30 && <Stamp className="right-5 rotate-[15deg] border-red-500 text-red-500">NOPE</Stamp>}

        <button
          onClick={report}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Report profile"
          className="absolute right-3 top-3 rounded-full bg-black/40 px-3 py-1 text-sm text-white"
        >
          ⚑ Report
        </button>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pt-16 text-white">
          <h2 className="text-3xl font-bold">{profile.name}, {profile.age ?? "?"}</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            {profile.vibe !== null && <span className="rounded-full bg-purple-600 px-3 py-1">✨ {profile.vibe}% vibe match</span>}
            <span className="rounded-full bg-green-600 px-3 py-1">
              {profile.replyRate === null ? "New here" : `Replies ${profile.replyRate}%`}
            </span>
          </div>
          <p className="mt-2 line-clamp-3 text-sm">{profile.bio || "No bio yet..."}</p>
          {profile.voiceIntroUrl && (
            <>
              <audio ref={audio} src={profile.voiceIntroUrl} onEnded={() => setPlaying(false)} />
              <button
                onClick={toggleVoice}
                onPointerDown={(e) => e.stopPropagation()}
                className="mt-3 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur"
              >
                {playing ? "⏸ Pause voice intro" : "▶ Play voice intro"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-16">
        <button onClick={() => swipe("left")} aria-label="Pass" className="h-16 w-16 rounded-full bg-white text-3xl text-red-500 shadow-xl active:scale-95">✕</button>
        <button onClick={() => swipe("right")} aria-label="Like" className="h-16 w-16 rounded-full bg-white text-3xl text-green-500 shadow-xl active:scale-95">♥</button>
      </div>

      {match && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-6 text-center text-white backdrop-blur-md">
          <h2 className="text-4xl font-extrabold">It&apos;s a match! 🎉</h2>
          <p className="mt-2">You and {match.name} like each other.</p>
          <Link href={`/chat/${match.matchId}`} className="mt-8 w-full max-w-xs rounded-full bg-primary py-4 font-semibold">Send a message</Link>
          <button onClick={() => setMatch(null)} className="mt-4 py-2 text-gray-300">Keep swiping</button>
        </div>
      )}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center text-lg text-gray-700">{children}</div>;
}

function Stamp({ className, children }: { className: string; children: string }) {
  return <span className={`absolute top-8 rounded-lg border-4 px-3 py-1 text-3xl font-extrabold ${className}`}>{children}</span>;
}
