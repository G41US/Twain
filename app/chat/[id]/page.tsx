'use client';
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Message = { id: string; senderId: string; body: string; createdAt: string };
type Other = { id: string; name: string | null; photos: string[]; image: string | null };

// shortcut: polls every 3s; switch to Supabase Realtime or websockets if traffic grows.
const POLL_MS = 3000;

export default function Chat() {
  const { id: matchId } = useParams<{ id: string }>();
  const router = useRouter();
  const [me, setMe] = useState("");
  const [other, setOther] = useState<Other | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [menu, setMenu] = useState(false);
  const [gone, setGone] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/chat/${matchId}`);
    if (res.status === 404) return setGone(true);
    if (!res.ok) return;
    const data = await res.json();
    setMe(data.me);
    setOther(data.other);
    setMessages((old) => (old.length === data.messages.length ? old : data.messages));
  }, [matchId]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Braces matter: newer Chrome's scrollIntoView returns a Promise, and React would call it as a cleanup.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await fetch(`/api/chat/${matchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!res.ok) return alert(await res.text());
    setInput("");
    load();
  };

  const wingman = async () => {
    setThinking(true);
    const res = await fetch("/api/wingman", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    setThinking(false);
    const data = await res.json().catch(() => ({}));
    if (data.reply) setInput(data.reply);
    else alert(data.error ?? "Wingman is unavailable right now.");
  };

  const report = async () => {
    setMenu(false);
    const reason = prompt(`Why are you reporting ${other?.name ?? "this person"}?`);
    if (!reason?.trim() || !other) return;
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: other.id, reason }),
    });
    alert("Thanks — our team will review this.");
  };

  const block = async () => {
    setMenu(false);
    if (!other || !confirm(`Block ${other.name}? You'll unmatch and they won't see you again.`)) return;
    await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: other.id }),
    });
    router.replace("/matches");
  };

  if (gone) return <p className="p-8 text-center">This chat is no longer available. <Link href="/matches" className="text-primary underline">Back to matches</Link></p>;

  return (
    <main className="mx-auto flex h-[calc(100dvh-env(safe-area-inset-top))] max-w-md flex-col bg-white">
      <header className="relative flex items-center gap-3 border-b px-3 py-2">
        <Link href="/matches" aria-label="Back to matches" className="px-2 text-2xl">‹</Link>
        {other && <img src={other.photos[0] || other.image || "https://placehold.co/80?text=?"} alt="" className="h-10 w-10 rounded-full object-cover" />}
        <h1 className="flex-1 truncate text-lg font-semibold">{other?.name ?? "…"}</h1>
        <button onClick={() => setMenu(!menu)} aria-label="More options" aria-expanded={menu} className="px-3 text-2xl">⋯</button>
        {menu && (
          <div className="absolute right-3 top-12 z-10 w-48 overflow-hidden rounded-xl border bg-white shadow-lg">
            <button onClick={report} className="block w-full px-4 py-3 text-left active:bg-gray-50">Report</button>
            <button onClick={block} className="block w-full px-4 py-3 text-left text-red-600 active:bg-gray-50">Block &amp; unmatch</button>
          </div>
        )}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {messages.length === 0 && <p className="mt-10 text-center text-gray-500">You matched! Say hi 👋<br />Stuck? Tap ✨ for an opener.</p>}
        {messages.map((m) => (
          <p
            key={m.id}
            className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 ${
              m.senderId === me ? "ml-auto rounded-br-sm bg-primary text-white" : "rounded-bl-sm bg-gray-100"
            }`}
          >
            {m.body}
          </p>
        ))}
        <div ref={bottom} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex gap-2 border-t p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <button type="button" onClick={wingman} disabled={thinking} aria-label="AI wingman suggestion" className="shrink-0 rounded-full bg-purple-100 px-3 text-xl disabled:opacity-50">
          {thinking ? "…" : "✨"}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Message…"
          aria-label="Message"
          className="min-w-0 flex-1 rounded-full border px-4 py-3"
        />
        <button type="submit" disabled={sending || !input.trim()} className="shrink-0 rounded-full bg-primary px-5 font-semibold text-white disabled:opacity-50">
          Send
        </button>
      </form>
    </main>
  );
}
