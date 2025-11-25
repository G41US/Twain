'use client';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Profile = {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  photos?: string[];
  voiceIntroUrl?: string;
  replyRate?: number;
  dealbreakers?: string[];
};

export default function Swipe() {
  const { data: session } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (session) {
      fetch("/api/swipe/candidates")
        .then(r => r.json())
        .then(data => setProfiles(data));
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

  if (!session) return <p className="text-center text-xl mt-20">Please sign in</p>;
  if (profiles.length === 0 || current >= profiles.length) return <p className="text-center text-xl mt-20">No more profiles 😢</p>;

  const profile = profiles[current];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 p-4">
      <div className="relative w-96 h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden">
        <img 
          src={profile.photos?.[0] || "https://via.placeholder.com/384x600?text=No+Photo"} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
        {profile.voiceIntroUrl && (
          <audio src={profile.voiceIntroUrl} autoPlay loop className="hidden" />
        )}
        <div className="absolute bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8 text-white w-full">
          <h2 className="text-4xl font-bold">{profile.name}, {profile.age || "?"}</h2>
          {profile.replyRate !== undefined && (
            <span className="inline-block bg-green-600 px-4 py-1 rounded-full text-sm mt-2">
              Reply Rate: {Math.round(profile.replyRate)}%
            </span>
          )}
          <p className="mt-3 text-lg">{profile.bio || "No bio yet..."}</p>
          {profile.dealbreakers?.length ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.dealbreakers.map(d => (
                <span key={d} className="bg-red-600 px-3 py-1 rounded-full text-xs">
                  {d.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-20 mt-10">
        <button 
          onClick={() => swipe('left')} 
          className="bg-red-600 hover:bg-red-700 text-white w-20 h-20 rounded-full text-5xl shadow-2xl transition transform hover:scale-110">
          ✕
        </button>
        <button 
          onClick={() => swipe('right')} 
          className="bg-green-600 hover:bg-green-700 text-white w-20 h-20 rounded-full text-5xl shadow-2xl transition transform hover:scale-110">
          ♥
        </button>
      </div>
    </div>
  );
}
