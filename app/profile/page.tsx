'use client';
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { uploadFile } from "@/lib/supabase";
import { looksExplicit } from "@/lib/nsfw";
import { enablePush, pushSupported } from "@/lib/push-client";
import { CITIES, DEALBREAKERS, DISTANCES, ETHNICITIES, TRAITS, VIBE_QUESTIONS, slug } from "@/lib/options";

const MAX_PHOTOS = 6;
const MAX_VOICE_MS = 30_000;

type Me = {
  name: string | null; bio: string | null; age: number | null; gender: string | null; lookingFor: string | null;
  ethnicity: string | null; preferEthnicity: string | null; photos: string[]; voiceIntroUrl: string | null;
  vibeAnswers: Record<string, boolean> | null; traits: string[]; dealbreakers: string[];
  latitude: number | null; longitude: number | null; maxDistanceKm: number; ageMin: number; ageMax: number;
  acceptedTermsAt: string | null; sensitiveConsentAt: string | null;
  verified: boolean; selfieStatus: string | null; isAdmin: boolean;
};

type Form = {
  acceptTerms: boolean; photos: string[]; bio: string; age: string; gender: string; lookingFor: string;
  latitude: number | null; longitude: number | null; locationLabel: string; maxDistanceKm: number; ageMin: string; ageMax: string;
  voiceIntroUrl: string; vibeAnswers: Record<string, boolean>; traits: string[]; dealbreakers: string[];
  ethnicity: string; preferEthnicity: string; sensitiveConsent: boolean;
};

const STEPS = ["Welcome", "Photos", "About you", "Where & who", "Voice intro", "Vibe check", "Preferences", "Notifications"] as const;
type Step = (typeof STEPS)[number];

const isComplete = (m: Me) => !!(m.acceptedTermsAt && m.photos.length && m.gender && m.lookingFor && m.age && m.latitude !== null);

export default function Profile() {
  const { status } = useSession();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile").then((r) => r.json()).then((p: Me) => {
      setMe(p);
      setWizard(!isComplete(p));
      setForm({
        acceptTerms: !!p.acceptedTermsAt, photos: p.photos, bio: p.bio ?? "", age: p.age?.toString() ?? "",
        gender: p.gender ?? "", lookingFor: p.lookingFor ?? "", latitude: p.latitude, longitude: p.longitude,
        locationLabel: p.latitude !== null ? "Location saved ✓" : "", maxDistanceKm: p.maxDistanceKm,
        ageMin: String(p.ageMin), ageMax: String(p.ageMax), voiceIntroUrl: p.voiceIntroUrl ?? "",
        vibeAnswers: p.vibeAnswers ?? {}, traits: p.traits, dealbreakers: p.dealbreakers,
        ethnicity: p.ethnicity ?? "", preferEthnicity: p.preferEthnicity ?? "all", sensitiveConsent: !!p.sensitiveConsentAt,
      });
    });
  }, [status]);

  if (status === "unauthenticated") return <p className="p-8 text-center">Please <Link href="/" className="text-primary underline">sign in</Link></p>;
  if (!me || !form) return <p className="p-8 text-center text-gray-500">Loading…</p>;

  const set = (patch: Partial<Form>) => { setError(""); setForm((f) => ({ ...f!, ...patch })); };

  // Fields each step owns, as sent to the API. Validation returns an error message or "".
  const steps: Record<Step, { valid: () => string; body: () => Record<string, unknown> }> = {
    Welcome: { valid: () => (form.acceptTerms ? "" : "Please confirm you're 18+ and agree to continue."), body: () => ({ acceptTerms: true }) },
    Photos: { valid: () => (form.photos.length ? "" : "Add at least one photo of yourself."), body: () => ({ photos: form.photos }) },
    "About you": {
      valid: () => (!form.gender || !form.lookingFor ? "Pick your gender and who you're looking for."
        : !(Number(form.age) >= 18 && Number(form.age) <= 100) ? "Enter your age (18+)." : ""),
      body: () => ({ bio: form.bio, age: Number(form.age), gender: form.gender, lookingFor: form.lookingFor }),
    },
    "Where & who": {
      valid: () => (form.latitude === null ? "Share your location or pick your city."
        : Number(form.ageMin) > Number(form.ageMax) ? "The minimum age is higher than the maximum." : ""),
      body: () => ({ latitude: form.latitude, longitude: form.longitude, maxDistanceKm: form.maxDistanceKm, ageMin: Number(form.ageMin), ageMax: Number(form.ageMax) }),
    },
    "Voice intro": { valid: () => "", body: () => ({ voiceIntroUrl: form.voiceIntroUrl }) },
    "Vibe check": {
      valid: () => "",
      body: () => ({
        vibeAnswers: Object.fromEntries(VIBE_QUESTIONS.map((q) => [q, !!form.vibeAnswers[q]])),
        traits: form.traits, dealbreakers: form.dealbreakers,
      }),
    },
    Preferences: {
      valid: () => (form.ethnicity && !form.sensitiveConsent ? "Tick the consent box to save your ethnicity, or leave it blank." : ""),
      body: () => ({ ethnicity: form.ethnicity || null, preferEthnicity: form.preferEthnicity, sensitiveConsent: form.sensitiveConsent }),
    },
    Notifications: { valid: () => "", body: () => ({}) },
  };

  const save = async (names: readonly Step[]) => {
    const problem = names.map((n) => steps[n].valid()).find(Boolean);
    if (problem) return setError(problem), false;
    const body = Object.assign({}, ...names.map((n) => steps[n].body()));
    if (Object.keys(body).length === 0) return true;
    setSaving(true);
    const res = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) return setError("Couldn't save — please check your answers and try again."), false;
    setError("");
    return true;
  };

  const next = async () => {
    if (!(await save([STEPS[step]]))) return;
    if (step < STEPS.length - 1) setStep(step + 1), scrollTo(0, 0);
    else router.push("/swipe");
  };

  const sections: Record<Step, React.ReactNode> = {
    Welcome: <Welcome form={form} set={set} />,
    Photos: <Photos form={form} set={set} setError={setError} />,
    "About you": <About form={form} set={set} />,
    "Where & who": <WhereWho form={form} set={set} setError={setError} />,
    "Voice intro": <Voice form={form} set={set} setError={setError} />,
    "Vibe check": <Vibes form={form} set={set} />,
    Preferences: <Ethnicity form={form} set={set} />,
    Notifications: <Notifications />,
  };

  if (wizard) {
    const name = STEPS[step];
    return (
      <main className="mx-auto max-w-md px-4 pb-6 pt-4">
        <div className="mb-4 flex gap-1" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-gray-200"}`} />)}
        </div>
        <h1 className="mb-4 text-2xl font-bold">{name}</h1>
        {sections[name]}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex gap-3">
          {step > 0 && <button onClick={() => { setError(""); setStep(step - 1); }} className="flex-1 rounded-full border py-4 font-semibold">Back</button>}
          <button onClick={next} disabled={saving} className="flex-[2] rounded-full bg-primary py-4 font-semibold text-white disabled:opacity-60">
            {saving ? "Saving…" : step === STEPS.length - 1 ? "Start swiping 🚀" : name === "Voice intro" && !form.voiceIntroUrl ? "Skip for now" : "Next"}
          </button>
        </div>
      </main>
    );
  }

  const editable = STEPS.filter((s) => s !== "Welcome" && s !== "Notifications");
  return (
    <main className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-6 text-3xl font-bold">Your profile</h1>
      <div className="space-y-8">
        {editable.map((s) => (
          <section key={s}>
            <h2 className="mb-3 text-lg font-bold">{s}</h2>
            {sections[s]}
          </section>
        ))}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button
          onClick={async () => { if (await save(editable)) router.push("/swipe"); }}
          disabled={saving}
          className="w-full rounded-full bg-gradient-to-r from-pink-600 to-purple-600 py-4 text-lg font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>

        <Verification me={me} setMe={setMe} />
        <section>
          <h2 className="mb-3 text-lg font-bold">Notifications</h2>
          <Notifications />
        </section>

        <section className="space-y-3 border-t pt-6 pb-4 text-sm">
          <div className="flex justify-between">
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-gray-600 underline">Sign out</button>
            {me.isAdmin && <Link href="/admin" className="font-semibold text-red-600 underline">Admin</Link>}
          </div>
          <div className="flex gap-4 text-gray-500">
            <Link href="/privacy" className="underline">Privacy</Link>
            <Link href="/terms" className="underline">Terms</Link>
          </div>
          <DeleteAccount />
        </section>
      </div>
    </main>
  );
}

type SectionProps = { form: Form; set: (p: Partial<Form>) => void; setError?: (e: string) => void };
const field = "w-full rounded-xl border bg-white p-4";

function Welcome({ form, set }: SectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-700">Let&apos;s set up your profile. It takes about 2 minutes.</p>
      <ul className="space-y-2 rounded-2xl bg-pink-50 p-4 text-sm text-gray-800">
        <li>✅ Be yourself: real photos, real age.</li>
        <li>🚫 Never send money to anyone you meet here.</li>
        <li>⚑ Report anyone who makes you uncomfortable.</li>
      </ul>
      <label className="flex items-start gap-3 rounded-2xl border p-4">
        <input type="checkbox" checked={form.acceptTerms} onChange={(e) => set({ acceptTerms: e.target.checked })} className="mt-1 h-5 w-5" />
        <span className="text-sm">
          I&apos;m 18 or older and I agree to the <Link href="/terms" target="_blank" className="text-primary underline">Terms</Link> and{" "}
          <Link href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</Link>.
        </span>
      </label>
    </div>
  );
}

function Photos({ form, set, setError }: SectionProps) {
  const [busy, setBusy] = useState("");
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, MAX_PHOTOS - form.photos.length);
    const urls: string[] = [];
    for (let i = 0; i < picked.length; i++) {
      const f = picked[i];
      setBusy(`Checking ${i + 1}/${picked.length}…`);
      if (await looksExplicit(f)) { setError?.("That photo looks explicit, so it can't be used. Please pick another."); continue; }
      setBusy(`Uploading ${i + 1}/${picked.length}…`);
      try { urls.push(await uploadFile("photo", f)); } catch { setError?.("Upload failed. Use a JPG, PNG or WebP under 4MB."); }
    }
    setBusy("");
    if (urls.length) set({ photos: [...form.photos, ...urls].slice(0, MAX_PHOTOS) });
  };
  return (
    <div>
      <p className="mb-3 text-sm text-gray-600">Clear photos of your face get the most matches. Your first photo is your main one.</p>
      <div className="grid grid-cols-3 gap-2">
        {form.photos.map((url, i) => (
          <div key={url} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-200">
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" onClick={() => set({ photos: form.photos.filter((x) => x !== url) })} aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 h-8 w-8 rounded-full bg-black/60 text-white">✕</button>
          </div>
        ))}
        {form.photos.length < MAX_PHOTOS && (
          <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-1 text-center text-gray-500">
            <span className="text-3xl">{busy ? "…" : "+"}</span>
            <span className="text-xs">{busy || "Add photo"}</span>
            <input type="file" accept="image/*" multiple className="sr-only" disabled={!!busy} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
    </div>
  );
}

function About({ form, set }: SectionProps) {
  const label = "mb-1 block text-sm font-semibold";
  return (
    <div className="space-y-4">
      <label className="block"><span className={label}>Age</span>
        <input value={form.age} onChange={(e) => set({ age: e.target.value })} type="number" inputMode="numeric" placeholder="e.g. 25" min={18} max={100} className={field} />
      </label>
      <label className="block"><span className={label}>I am a</span>
        <select value={form.gender} onChange={(e) => set({ gender: e.target.value })} className={field}>
          <option value="">Choose…</option>
          <option value="Male">Man</option>
          <option value="Female">Woman</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Other">Other</option>
        </select>
      </label>
      <label className="block"><span className={label}>Show me</span>
        <select value={form.lookingFor} onChange={(e) => set({ lookingFor: e.target.value })} className={field}>
          <option value="">Choose…</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Everyone">Everyone</option>
        </select>
      </label>
      <label className="block"><span className={label}>Bio</span>
        <textarea value={form.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={500} rows={4}
          placeholder="A little about you — what you do, what you love, what you're looking for…" className={field} />
      </label>
    </div>
  );
}

function WhereWho({ form, set, setError }: SectionProps) {
  const [locating, setLocating] = useState(false);
  const useGps = () => {
    if (!navigator.geolocation) return setError?.("Your phone can't share location here — pick your city instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocating(false); set({ latitude: p.coords.latitude, longitude: p.coords.longitude, locationLabel: "Using your current location ✓" }); },
      () => { setLocating(false); setError?.("Couldn't get your location — pick your city instead."); },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-blue-50 p-4">
        <p className="mb-3 text-sm text-blue-900">We only store your location to about 1&nbsp;km and only show others how far away you are.</p>
        <button type="button" onClick={useGps} disabled={locating} className="w-full rounded-full bg-blue-600 py-3 font-semibold text-white disabled:opacity-60">
          {locating ? "Finding you…" : "📍 Use my location"}
        </button>
        <select value="" onChange={(e) => { const c = CITIES[Number(e.target.value)]; if (c) set({ latitude: c.lat, longitude: c.lng, locationLabel: `${c.name} ✓` }); }}
          aria-label="Or pick your city" className={`${field} mt-3`}>
          <option value="">…or pick your city</option>
          {CITIES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
        </select>
        {form.locationLabel && <p className="mt-2 text-sm font-semibold text-blue-900">{form.locationLabel}</p>}
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Show people within</span>
        <select value={form.maxDistanceKm} onChange={(e) => set({ maxDistanceKm: Number(e.target.value) })} className={field}>
          {DISTANCES.map((d) => <option key={d} value={d}>{d === 500 ? "Anywhere in Nigeria" : `${d} km`}</option>)}
        </select>
      </label>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Aged between</legend>
        <div className="flex items-center gap-3">
          <input value={form.ageMin} onChange={(e) => set({ ageMin: e.target.value })} type="number" inputMode="numeric" min={18} max={100} aria-label="Minimum age" className={field} />
          <span>and</span>
          <input value={form.ageMax} onChange={(e) => set({ ageMax: e.target.value })} type="number" inputMode="numeric" min={18} max={100} aria-label="Maximum age" className={field} />
        </div>
      </fieldset>
    </div>
  );
}

function Voice({ form, set, setError }: SectionProps) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const start = async () => {
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { return setError?.("Microphone access is needed to record your voice intro."); }
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream);
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      const type = r.mimeType.split(";")[0] || "audio/webm";
      const file = new File(chunks, `voice.${type.includes("mp4") ? "m4a" : "webm"}`, { type });
      setUploading(true);
      try { set({ voiceIntroUrl: await uploadFile("voice", file) }); } catch { setError?.("Voice upload failed — try again."); }
      setUploading(false);
    };
    r.start();
    recorder.current = r;
    setRecording(true);
    setTimeout(() => r.state === "recording" && r.stop(), MAX_VOICE_MS);
  };
  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
      <p className="mb-3 text-sm text-red-900">Profiles with a voice intro get more replies. Say hi and one fun thing about you (up to 30 seconds).</p>
      {form.voiceIntroUrl && <audio src={form.voiceIntroUrl} controls className="mb-3 w-full" />}
      {recording ? (
        <button type="button" onClick={() => recorder.current?.stop()} className="w-full rounded-full bg-red-600 py-3 font-semibold text-white">⏹ Stop recording</button>
      ) : (
        <button type="button" onClick={start} disabled={uploading} className="w-full rounded-full bg-red-600 py-3 font-semibold text-white disabled:opacity-60">
          {uploading ? "Uploading…" : form.voiceIntroUrl ? "🎙 Re-record" : "🎙 Record voice intro"}
        </button>
      )}
    </div>
  );
}

function Vibes({ form, set }: SectionProps) {
  const toggle = (list: "traits" | "dealbreakers", v: string) =>
    set({ [list]: form[list].includes(v) ? form[list].filter((x) => x !== v) : [...form[list], v] });
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-purple-50 p-4">
        <p className="mb-2 text-sm text-purple-900">Tick what&apos;s true for you. We show people how much you vibe.</p>
        {VIBE_QUESTIONS.map((q) => (
          <label key={q} className="flex items-center gap-3 py-2">
            <input type="checkbox" checked={!!form.vibeAnswers[q]} onChange={(e) => set({ vibeAnswers: { ...form.vibeAnswers, [q]: e.target.checked } })} className="h-5 w-5 shrink-0" />
            <span className="text-sm">{q}</span>
          </label>
        ))}
      </div>
      <div className="rounded-2xl bg-green-50 p-4">
        <p className="mb-2 text-sm font-semibold text-green-900">About me (private, used for matching)</p>
        {TRAITS.map((t) => (
          <label key={t.value} className="flex items-center gap-3 py-2">
            <input type="checkbox" checked={form.traits.includes(t.value)} onChange={() => toggle("traits", t.value)} className="h-5 w-5" />
            <span className="text-sm">{t.label}</span>
          </label>
        ))}
      </div>
      <div className="rounded-2xl bg-orange-50 p-4">
        <p className="mb-2 text-sm font-semibold text-orange-900">Dealbreakers: don&apos;t show me people who…</p>
        {DEALBREAKERS.map((d) => (
          <label key={d.value} className="flex items-center gap-3 py-2">
            <input type="checkbox" checked={form.dealbreakers.includes(d.value)} onChange={() => toggle("dealbreakers", d.value)} className="h-5 w-5" />
            <span className="text-sm">{d.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Ethnicity({ form, set }: SectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Optional. Never shown on your profile.</p>
      <select value={form.ethnicity} onChange={(e) => set({ ethnicity: e.target.value })} aria-label="Your ethnicity" className={field}>
        <option value="">Your ethnicity (optional)</option>
        {ETHNICITIES.map((e) => <option key={e} value={slug(e)}>{e}</option>)}
      </select>
      {form.ethnicity && (
        <label className="flex items-start gap-3 rounded-2xl border p-4">
          <input type="checkbox" checked={form.sensitiveConsent} onChange={(e) => set({ sensitiveConsent: e.target.checked })} className="mt-1 h-5 w-5" />
          <span className="text-sm">I consent to Twain storing my ethnicity, which is sensitive personal data, only for matching filters. I can remove it any time.</span>
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">🔒 Who do you prefer to see? (private)</span>
        <select value={form.preferEthnicity} onChange={(e) => set({ preferEthnicity: e.target.value })} className={field}>
          <option value="all">Everyone</option>
          {ETHNICITIES.map((e) => <option key={e} value={slug(e)}>Prefer {e}</option>)}
        </select>
      </label>
    </div>
  );
}

function Notifications() {
  const [state, setState] = useState<string>("");
  useEffect(() => {
    if (!pushSupported()) setState("unsupported");
    else if (Notification.permission === "granted") enablePush().then(setState); // re-register this device quietly
    else setState(Notification.permission);
  }, []);
  if (state === "unsupported") return <p className="text-sm text-gray-600">This browser can&apos;t show notifications. Install the Twain app to get them.</p>;
  if (state === "granted") return <p className="rounded-2xl bg-green-50 p-4 text-sm text-green-900">🔔 Notifications are on. We&apos;ll tell you about new matches and messages.</p>;
  if (state === "denied") return <p className="rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-900">Notifications are blocked. Turn them on in your phone&apos;s settings for Twain.</p>;
  if (state === "failed") return <p className="rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-900">Couldn&apos;t turn on notifications right now. You can try again later from your profile.</p>;
  return (
    <div className="rounded-2xl bg-yellow-50 p-4">
      <p className="mb-3 text-sm text-yellow-900">Get told the moment you match or someone messages you.</p>
      <button type="button" onClick={async () => setState(await enablePush())} className="w-full rounded-full bg-yellow-500 py-3 font-semibold text-white">🔔 Turn on notifications</button>
    </div>
  );
}

function Verification({ me, setMe }: { me: Me; setMe: (m: Me) => void }) {
  const [pose, setPose] = useState("");
  const [busy, setBusy] = useState(false);
  if (me.verified) return <p className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-900">✓ You&apos;re verified. Your badge shows on your profile.</p>;
  if (me.selfieStatus === "pending") return <p className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">⏳ Your verification selfie is being reviewed.</p>;

  const submit = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const selfieUrl = await uploadFile("selfie", file);
      const res = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selfieUrl }) });
      if (!res.ok) throw new Error();
      setMe({ ...me, selfieStatus: "pending" });
    } catch {
      alert("Couldn't send your selfie. Try again.");
    }
    setBusy(false);
  };

  return (
    <section className="rounded-2xl bg-blue-50 p-4">
      <h2 className="mb-1 text-lg font-bold text-blue-900">Get verified ✓</h2>
      <p className="mb-3 text-sm text-blue-900">
        {me.selfieStatus === "rejected" ? "Your last selfie wasn't approved. " : ""}
        Verified profiles get more trust and more matches. Take a selfie copying a pose; we compare it to your photos.
      </p>
      {!pose ? (
        <button type="button" onClick={async () => setPose((await (await fetch("/api/verify")).json()).pose)} className="w-full rounded-full bg-blue-600 py-3 font-semibold text-white">
          Start verification
        </button>
      ) : (
        <>
          <p className="mb-3 rounded-xl bg-white p-3 text-center text-lg font-semibold">{pose}</p>
          <label className={`block w-full cursor-pointer rounded-full bg-blue-600 py-3 text-center font-semibold text-white ${busy ? "opacity-60" : ""}`}>
            {busy ? "Sending…" : "📸 Take selfie"}
            <input type="file" accept="image/*" capture="user" className="sr-only" disabled={busy} onChange={(e) => submit(e.target.files?.[0])} />
          </label>
        </>
      )}
    </section>
  );
}

function DeleteAccount() {
  const [busy, setBusy] = useState(false);
  const del = async () => {
    if (!confirm("Delete your account? Your profile, matches, messages and photos will be permanently deleted. This can't be undone.")) return;
    setBusy(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) return signOut({ callbackUrl: "/" });
    setBusy(false);
    alert("Couldn't delete your account. Please try again.");
  };
  return (
    <button onClick={del} disabled={busy} className="text-red-600 underline disabled:opacity-60">
      {busy ? "Deleting…" : "Delete account"}
    </button>
  );
}
