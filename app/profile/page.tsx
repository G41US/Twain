'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const vibeQuestions = [
  "Pineapple on pizza is elite",
  "Cats > Dogs",
  "I believe in astrology",
  "I want kids someday",
  "I smoke weed regularly",
  "I'm sober",
  "I'm vegan/vegetarian",
  "I voted for Trump",
  "I reply to messages fast",
];

const dealbreakersList = [
  "Smokes cigarettes", "Wants kids soon", "Vegan", "Heavy drinker", 
  "Lives with parents", "Has debt", "Trump supporter", "Anti-vax"
];

const ethnicities = [
  "Black", "White", "Asian", "Latin/Hispanic", 
  "Middle Eastern", "Indian/South Asian", "Native/Indigenous", "Mixed", "Other"
];

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState("");

  const startRecording = async () => {
    alert("In full app, this uses MediaRecorder. For now, paste a direct MP3/WAV link.");
    const url = prompt("Paste direct link to your 30-sec voice intro:");
    if (url) setVoiceUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const vibeAnswers: Record<string, boolean> = {};
    vibeQuestions.forEach(q => {
      vibeAnswers[q] = (formData.get(q.replace(/ /g, "_")) as string) === "on";
    });
    const dealbreakers = Array.from(e.currentTarget.querySelectorAll('input[name="dealbreakers"]:checked') as NodeListOf<HTMLInputElement>)
  .map(i => i.value);

    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio: formData.get("bio"),
        age: Number(formData.get("age")),
        gender: formData.get("gender"),
        lookingFor: formData.get("lookingFor"),
        ethnicity: formData.get("ethnicity"),
        preferEthnicity: formData.get("preferEthnicity") || "all",
        voiceIntroUrl: voiceUrl,
        vibeAnswers,
        dealbreakers,
      }),
    });

    alert("Profile saved! 🎉 Start swiping.");
    router.push("/swipe");
  };

  if (!session) return <p>Please sign in</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Complete Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <textarea name="bio" placeholder="Tell us about yourself..." className="w-full p-4 border rounded-lg" rows={4} required />

        <input name="age" type="number" placeholder="Age (18+)" min="18" className="w-full p-4 border rounded-lg" required />

        <select name="gender" className="w-full p-4 border rounded-lg" required>
          <option value="">Your gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Non-binary</option>
          <option>Other</option>
        </select>

        <select name="lookingFor" className="w-full p-4 border rounded-lg" required>
          <option value="">Looking for</option>
          <option>Men</option>
          <option>Women</option>
          <option>Everyone</option>
        </select>

        <select name="ethnicity" className="w-full p-4 border rounded-lg">
          <option value="">Your ethnicity (optional)</option>
          {ethnicities.map(e => <option key={e} value={e.toLowerCase().replace(/[^a-z]/g, "")}>{e}</option>)}
        </select>

        <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
          <p className="font-semibold text-purple-900 mb-3">🔒 Who do you prefer to see? (Private)</p>
          <select name="preferEthnicity" className="w-full p-4 border rounded-lg">
            <option value="all">Everyone</option>
            {ethnicities.map(e => <option key={e} value={e.toLowerCase().replace(/[^a-z]/g, "")}>Prefer {e}</option>)}
          </select>
        </div>

        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <h3 className="font-bold text-red-800 mb-3">Record 30-sec Voice Intro (Required)</h3>
          {voiceUrl ? (
            <audio src={voiceUrl} controls className="w-full mb-4" />
          ) : (
            <button type="button" onClick={startRecording} className="bg-red-600 text-white px-8 py-4 rounded-full">
              Record Voice Intro
            </button>
          )}
        </div>

        <div className="bg-purple-50 p-6 rounded-xl">
          <h3 className="font-bold text-purple-900 mb-4">Vibe Check (Check your truths)</h3>
          {vibeQuestions.map(q => (
            <label key={q} className="flex items-center gap-3 mb-3">
              <input type="checkbox" name={q.replace(/ /g, "_")} className="w-5 h-5" />
              <span className="text-sm">{q}</span>
            </label>
          ))}
        </div>

        <div className="bg-orange-50 p-6 rounded-xl">
          <h3 className="font-bold text-orange-900 mb-4">Dealbreakers (Hide these people)</h3>
          {dealbreakersList.map(d => (
            <label key={d} className="flex items-center gap-3 mb-3">
              <input type="checkbox" name="dealbreakers" value={d.toLowerCase().replace(/ /g, "-")} className="w-5 h-5" />
              <span className="text-sm">{d}</span>
            </label>
          ))}
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-5 rounded-full text-xl font-bold">
          Save & Start Swiping 🚀
        </button>
      </form>
    </div>
  );
}
