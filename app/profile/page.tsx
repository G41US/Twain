'use client';
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useUploadThing } from "@/lib/uploadthing-client";

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

const MAX_PHOTOS = 6;
const MAX_VOICE_MS = 30_000;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

type Me = {
  bio: string | null; age: number | null; gender: string | null; lookingFor: string | null;
  ethnicity: string | null; preferEthnicity: string | null; photos: string[];
  voiceIntroUrl: string | null; vibeAnswers: Record<string, boolean> | null;
  dealbreakers: string[]; isAdmin: boolean;
};

export default function Profile() {
  const { status } = useSession();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [voiceUrl, setVoiceUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const photoUpload = useUploadThing("photo");
  const voiceUpload = useUploadThing("voice");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile").then((r) => r.json()).then((p: Me) => {
      setMe(p);
      setPhotos(p.photos);
      setVoiceUrl(p.voiceIntroUrl ?? "");
    });
  }, [status]);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    const res = await photoUpload.startUpload(picked).catch(() => undefined);
    if (!res) return alert("Photo upload failed. Use JPG/PNG under 4MB.");
    setPhotos((p) => [...p, ...res.map((f) => f.ufsUrl)].slice(0, MAX_PHOTOS));
  };

  const startRecording = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return alert("Microphone access is needed to record your voice intro.");
    }
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream);
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      const type = r.mimeType.split(";")[0] || "audio/webm";
      const file = new File(chunks, `voice-intro.${type.includes("mp4") ? "m4a" : "webm"}`, { type });
      const res = await voiceUpload.startUpload([file]).catch(() => undefined);
      if (res?.[0]) setVoiceUrl(res[0].ufsUrl);
      else alert("Voice upload failed — try again.");
    };
    r.start();
    recorder.current = r;
    setRecording(true);
    setTimeout(() => r.state === "recording" && r.stop(), MAX_VOICE_MS);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const vibeAnswers = Object.fromEntries(vibeQuestions.map((q) => [q, fd.get(q) === "on"]));

    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio: fd.get("bio"),
        age: Number(fd.get("age")),
        gender: fd.get("gender"),
        lookingFor: fd.get("lookingFor"),
        ethnicity: fd.get("ethnicity") || null,
        preferEthnicity: fd.get("preferEthnicity") || "all",
        photos,
        voiceIntroUrl: voiceUrl,
        vibeAnswers,
        dealbreakers: fd.getAll("dealbreakers"),
      }),
    });
    setSaving(false);
    if (!res.ok) return alert("Couldn't save — check your age is 18+ and your bio is under 500 characters.");
    router.push("/swipe");
  };

  if (status === "unauthenticated") return <p className="p-8 text-center">Please <Link href="/" className="text-primary underline">sign in</Link></p>;
  if (!me) return <p className="p-8 text-center text-gray-500">Loading…</p>;

  const field = "w-full rounded-xl border bg-white p-4";

  return (
    <main className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-6 text-3xl font-bold">Your profile</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <h2 className="mb-2 font-semibold">Photos ({photos.length}/{MAX_PHOTOS})</h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <div key={url} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-200">
                <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((p) => p.filter((x) => x !== url))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 h-7 w-7 rounded-full bg-black/60 text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-500">
                <span className="text-3xl">{photoUpload.isUploading ? "…" : "+"}</span>
                <span className="text-xs">{photoUpload.isUploading ? "Uploading" : "Add photo"}</span>
                <input type="file" accept="image/*" multiple className="sr-only" disabled={photoUpload.isUploading} onChange={(e) => addPhotos(e.target.files)} />
              </label>
            )}
          </div>
        </section>

        <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
          <h2 className="mb-2 font-semibold text-red-800">Voice intro (up to 30 sec)</h2>
          {voiceUrl && <audio src={voiceUrl} controls className="mb-3 w-full" />}
          {recording ? (
            <button type="button" onClick={() => recorder.current?.stop()} className="w-full rounded-full bg-red-600 py-3 font-semibold text-white">
              ⏹ Stop recording
            </button>
          ) : (
            <button type="button" onClick={startRecording} disabled={voiceUpload.isUploading} className="w-full rounded-full bg-red-600 py-3 font-semibold text-white disabled:opacity-60">
              {voiceUpload.isUploading ? "Uploading…" : voiceUrl ? "🎙 Re-record" : "🎙 Record voice intro"}
            </button>
          )}
        </section>

        <textarea name="bio" defaultValue={me.bio ?? ""} maxLength={500} placeholder="Tell us about yourself..." className={field} rows={4} required />
        <input name="age" defaultValue={me.age ?? ""} type="number" placeholder="Age (18+)" min={18} max={120} className={field} required />

        <select name="gender" defaultValue={me.gender ?? ""} className={field} required>
          <option value="">Your gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Non-binary</option>
          <option>Other</option>
        </select>

        <select name="lookingFor" defaultValue={me.lookingFor ?? ""} className={field} required>
          <option value="">Looking for</option>
          <option>Men</option>
          <option>Women</option>
          <option>Everyone</option>
        </select>

        <select name="ethnicity" defaultValue={me.ethnicity ?? ""} className={field}>
          <option value="">Your ethnicity (optional)</option>
          {ethnicities.map((e) => <option key={e} value={slug(e)}>{e}</option>)}
        </select>

        <section className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4">
          <h2 className="mb-2 font-semibold text-purple-900">🔒 Who do you prefer to see? (Private)</h2>
          <select name="preferEthnicity" defaultValue={me.preferEthnicity ?? "all"} className={field}>
            <option value="all">Everyone</option>
            {ethnicities.map((e) => <option key={e} value={slug(e)}>Prefer {e}</option>)}
          </select>
        </section>

        <section className="rounded-2xl bg-purple-50 p-4">
          <h2 className="mb-3 font-semibold text-purple-900">Vibe check</h2>
          {vibeQuestions.map((q) => (
            <label key={q} className="flex items-center gap-3 py-2">
              <input type="checkbox" name={q} defaultChecked={me.vibeAnswers?.[q] ?? false} className="h-5 w-5" />
              <span className="text-sm">{q}</span>
            </label>
          ))}
        </section>

        <section className="rounded-2xl bg-orange-50 p-4">
          <h2 className="mb-3 font-semibold text-orange-900">Dealbreakers (hide these people)</h2>
          {dealbreakersList.map((d) => {
            const value = d.toLowerCase().replace(/ /g, "-");
            return (
              <label key={d} className="flex items-center gap-3 py-2">
                <input type="checkbox" name="dealbreakers" value={value} defaultChecked={me.dealbreakers.includes(value)} className="h-5 w-5" />
                <span className="text-sm">{d}</span>
              </label>
            );
          })}
        </section>

        <button type="submit" disabled={saving || photoUpload.isUploading || voiceUpload.isUploading} className="w-full rounded-full bg-gradient-to-r from-pink-600 to-purple-600 py-4 text-lg font-bold text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save & start swiping 🚀"}
        </button>
      </form>

      <div className="mt-6 flex justify-between pb-4 text-sm">
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-gray-500 underline">Sign out</button>
        {me.isAdmin && <Link href="/admin" className="font-semibold text-red-600 underline">Admin</Link>}
      </div>
    </main>
  );
}
