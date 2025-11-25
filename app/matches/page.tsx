'use client';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Matches() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch("/api/matches").then(r => r.json()).then(setMatches);
  }, [session]);

  if (!session) return <p>Please sign in</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Your Matches</h1>
      <div className="grid gap-6">
        {matches.map((m: any) => (
          <div key={m.id} className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold">{m.name}</h3>
            <p className="text-gray-600">{m.bio}</p>
            <Link href={`/chat/${m.id}`} className="bg-pink-600 text-white px-6 py-2 rounded-lg mt-4 inline-block">
              Start Chat
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
