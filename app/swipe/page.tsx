'use client';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Swipe() {
  const { data: session } = useSession();
  const [profiles, setProfiles] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (session) {
      fetch("/api/swipe/candidates").then(r => r.json()).then(setProfiles);
    }
  }, [session]);

  const swipe = async (direction: 'left' | 'right') => {
    const targetId = profiles[current]?.id;
    if (targetId) {
      await fetch(`/api/swipe/${direction}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
    }
    setCurrent(c => c + 1);
  };

  if (!session) return <p>Please sign in</p>;
  if (profiles.length === 0 || current >= profiles.length) return <p>No more profiles to swipe</p>;

  const profile = profiles[current];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="relative w-96 h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {profile.voiceIntroUrl && (
          <button className="absolute top-4 left-4 z-10 bg-black/50 text-white p-2 rounded-full">
            ▶️ Play Voice
          </button>
        )}
        <img src={profile.photos?.[0] || "https://via.placeholder.com/384x600?text=Photo"} className="w-full h-full object-cover" alt="Profile" />
        <div className="absolute bottom-0 bg-gradient-to-t from-black/90 to-transparent p-8 text-white w-full">
          <h2 className="text-4xl font-bold mb-2">{profile.name}, {profile.age}</h2>
          <div className="flex gap-2 mb-2">
            <span className="bg-green-600 px-3 py-1 rounded-full text-sm font-bold">
              Reply Rate: {Math.round(profile.replyRate)}%
            </span>
          </div>
          <p className="text-lg mb-4">{profile.bio || "No bio yet..."}</p>
          {profile.dealbreakers?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.dealbreakers.map((d: string) => (
                <span key={d} className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold">
                  {d.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-16 mt-10">
        <button onClick={() => swipe('left')} className="bg-red-600 text-white w-20 h-20 rounded-full text-4xl shadow-lg hover:scale-110 transition">✕</button>
        <button onClick={() => swipe('right')} className="bg-green-600 text-white w-20 h-20 rounded-full text-4xl shadow-lg hover:scale-110 transition">♥</button>
      </div>
    </div>
  );
}
