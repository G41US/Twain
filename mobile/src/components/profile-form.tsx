import { Ionicons } from "@expo/vector-icons";
import {
  AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState,
} from "expo-audio";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { Me } from "../ctx/profile";
import { api, ApiError, mimeFor, uploadFile } from "../lib/api";
import { API_URL } from "../lib/config";
import {
  CITIES, DEALBREAKERS, DISTANCES, ETHNICITIES, GENDERS, INTENTIONS, LOOKING_FOR, MAX_PROMPTS, PROMPT_MAX_CHARS, PROMPTS, slug, TRAITS, VIBE_QUESTIONS,
} from "../lib/options";
import { colors, font, tile } from "../lib/theme";
import { Card, Check, Choice, Field, T, IconLine, Notice } from "./ui";

export const MAX_PHOTOS = 6;
const MAX_VOICE_MS = 30_000;

export type Form = {
  acceptTerms: boolean; photos: string[]; bio: string; age: string; gender: string; lookingFor: string;
  latitude: number | null; longitude: number | null; locationLabel: string; maxDistanceKm: number; ageMin: string; ageMax: string;
  voiceIntroUrl: string; vibeAnswers: Record<string, boolean>; traits: string[]; dealbreakers: string[];
  ethnicity: string; preferEthnicity: string; sensitiveConsent: boolean;
  intention: string; prompts: { q: string; a: string }[];
};

export const formFrom = (p: Me): Form => ({
  acceptTerms: !!p.acceptedTermsAt, photos: p.photos ?? [], bio: p.bio ?? "", age: p.age?.toString() ?? "",
  gender: p.gender ?? "", lookingFor: p.lookingFor ?? "", latitude: p.latitude, longitude: p.longitude,
  locationLabel: p.latitude !== null ? "Location saved" : "", maxDistanceKm: p.maxDistanceKm,
  ageMin: String(p.ageMin), ageMax: String(p.ageMax), voiceIntroUrl: p.voiceIntroUrl ?? "",
  vibeAnswers: p.vibeAnswers ?? {}, traits: p.traits ?? [], dealbreakers: p.dealbreakers ?? [],
  ethnicity: p.ethnicity ?? "", preferEthnicity: p.preferEthnicity ?? "all", sensitiveConsent: !!p.sensitiveConsentAt,
  intention: p.intention ?? "", prompts: p.prompts ?? [],
});

export const STEPS = ["Welcome", "Photos", "About you", "Where & who", "Voice intro", "Vibe check", "Preferences", "Notifications"] as const;
export type Step = (typeof STEPS)[number];

/** Each step's check (error message or "") and the fields it sends to the API — same rules the API enforces. */
export const stepRules: Record<Step, { valid: (f: Form) => string; body: (f: Form) => Record<string, unknown> }> = {
  Welcome: { valid: (f) => (f.acceptTerms ? "" : "Please confirm you're 18+ and agree to continue."), body: () => ({ acceptTerms: true }) },
  Photos: { valid: (f) => (f.photos.length ? "" : "Add at least one photo of yourself."), body: (f) => ({ photos: f.photos }) },
  "About you": {
    valid: (f) => (!f.gender || !f.lookingFor ? "Pick your gender and who you want to see."
      : !(Number(f.age) >= 18 && Number(f.age) <= 100) ? "Enter your age (18+)."
      : !f.intention ? "Pick what you're here for."
      : f.prompts.some((p) => !p.a.trim()) ? "Answer your prompt or remove it." : ""),
    body: (f) => ({
      bio: f.bio.trim(), age: Number(f.age), gender: f.gender, lookingFor: f.lookingFor,
      intention: f.intention, prompts: f.prompts.map((p) => ({ q: p.q, a: p.a.trim() })),
    }),
  },
  "Where & who": {
    valid: (f) => (f.latitude === null ? "Share your location or pick your city."
      : !(Number(f.ageMin) >= 18 && Number(f.ageMax) <= 100) ? "Ages must be between 18 and 100."
      : Number(f.ageMin) > Number(f.ageMax) ? "The minimum age is higher than the maximum." : ""),
    body: (f) => ({ latitude: f.latitude, longitude: f.longitude, maxDistanceKm: f.maxDistanceKm, ageMin: Number(f.ageMin), ageMax: Number(f.ageMax) }),
  },
  "Voice intro": { valid: () => "", body: (f) => ({ voiceIntroUrl: f.voiceIntroUrl }) },
  "Vibe check": {
    valid: () => "",
    body: (f) => ({ vibeAnswers: Object.fromEntries(VIBE_QUESTIONS.map((q) => [q, !!f.vibeAnswers[q]])), traits: f.traits, dealbreakers: f.dealbreakers }),
  },
  Preferences: {
    valid: (f) => (f.ethnicity && !f.sensitiveConsent ? "Tick the consent box to save your ethnicity, or leave it blank." : ""),
    body: (f) => ({ ethnicity: f.ethnicity || null, preferEthnicity: f.preferEthnicity, sensitiveConsent: f.sensitiveConsent }),
  },
  Notifications: { valid: () => "", body: () => ({}) },
};

/** Validate and save these steps. Returns an error message, or "" when saved. */
export async function saveSteps(form: Form, steps: readonly Step[]): Promise<string> {
  const problem = steps.map((s) => stepRules[s].valid(form)).find(Boolean);
  if (problem) return problem;
  const body = Object.assign({}, ...steps.map((s) => stepRules[s].body(form)));
  if (Object.keys(body).length === 0) return "";
  try {
    await api("/api/profile", { body });
    return "";
  } catch (e) {
    // Plain-text 400s are written for people (e.g. "That photo looks explicit…"); show them as-is.
    if (e instanceof ApiError && e.status === 400 && !e.message.startsWith("{")) return e.message;
    return "Couldn't save. Check your connection and try again.";
  }
}

export type SectionProps = { form: Form; set: (p: Partial<Form>) => void; setError: (e: string) => void };

export function WelcomeSection({ form, set }: SectionProps) {
  return (
    <View style={{ gap: 16 }}>
      <T>Let&apos;s set up your profile. It takes about 2 minutes.</T>
      <Card style={{ gap: 14 }}>
        <IconLine icon="person-circle" color={tile.blue}>Be yourself: real photos, real age.</IconLine>
        <IconLine icon="hand-left" color={tile.red}>Never send money to anyone you meet here.</IconLine>
        <IconLine icon="flag" color={tile.orange}>Report anyone who makes you uncomfortable.</IconLine>
      </Card>
      <Check checked={form.acceptTerms} onChange={(v) => set({ acceptTerms: v })} label="I'm 18 or older and I agree to the Terms and Privacy Policy." />
      <View style={{ flexDirection: "row", gap: 20 }}>
        <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/terms`)}>Read the Terms</Text>
        <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/privacy`)}>Read the Privacy Policy</Text>
      </View>
    </View>
  );
}

export function PhotosSection({ form, set, setError }: SectionProps) {
  const [busy, setBusy] = useState(false);
  const add = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    setBusy(true);
    try {
      const url = await uploadFile("photo", a.uri, mimeFor(a.fileName ?? a.uri, a.mimeType));
      set({ photos: [...form.photos, url].slice(0, MAX_PHOTOS) });
    } catch {
      setError("Upload failed. Use a JPG, PNG or WebP photo under 4MB.");
    }
    setBusy(false);
  };
  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 10 }}>
        <IconLine icon="happy-outline" color={tile.orange}>Lead with a recent, clear photo of just you.</IconLine>
        <IconLine icon="body-outline" color={tile.blue}>Add one full-body photo.</IconLine>
        <IconLine icon="football-outline" color={tile.green}>Add one doing something you love. It&apos;s an easy conversation starter.</IconLine>
        <IconLine icon="sparkles-outline" color={tile.purple}>Skip heavy filters, old photos and group shots where it&apos;s hard to tell who you are.</IconLine>
      </Card>
      <T variant="small">Your first photo is your main one.</T>
      <View style={styles.grid}>
        {form.photos.map((url, i) => (
          <View key={url} style={styles.tile}>
            <Image source={url} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Photo ${i + 1}`} />
            {i === 0 ? <View style={styles.mainTag}><Text style={styles.mainTagText}>Main</Text></View> : null}
            <Pressable
              onPress={() => set({ photos: form.photos.filter((x) => x !== url) })}
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${i + 1}`}
              hitSlop={8}
              style={styles.remove}
            >
              <Ionicons name="close" size={16} color={colors.white} />
            </Pressable>
          </View>
        ))}
        {form.photos.length < MAX_PHOTOS ? (
          <Pressable onPress={add} disabled={busy} accessibilityRole="button" accessibilityLabel="Add photo" style={[styles.tile, styles.addTile]}>
            {busy ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="add" size={32} color={colors.brand} />}
            <Text style={styles.addText}>{busy ? "Uploading…" : "Add photo"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function AboutSection({ form, set }: SectionProps) {
  return (
    <View style={{ gap: 18 }}>
      <Field label="Age" value={form.age} onChangeText={(v) => set({ age: v.replace(/\D/g, "").slice(0, 3) })} keyboardType="number-pad" placeholder="e.g. 25" />
      <Choice label="I am a" options={GENDERS} value={form.gender} onChange={(v) => set({ gender: v })} />
      <Choice label="Show me" options={LOOKING_FOR} value={form.lookingFor} onChange={(v) => set({ lookingFor: v })} />
      <Choice label="I'm here for" options={INTENTIONS.map((i) => ({ value: i.value, label: i.label }))} value={form.intention}
        onChange={(v) => set({ intention: v })} />
      <PromptsEditor form={form} set={set} />
      <Field label="Bio" value={form.bio} onChangeText={(v) => set({ bio: v })} maxLength={500} multiline
        placeholder="What you do, what you love…" />
    </View>
  );
}

/** Up to 3 prompts from a fixed list, each answered in a line or two. */
function PromptsEditor({ form, set }: Pick<SectionProps, "form" | "set">) {
  const [picking, setPicking] = useState(false);
  const unused = PROMPTS.filter((q) => !form.prompts.some((p) => p.q === q));
  const answer = (i: number, a: string) => set({ prompts: form.prompts.map((p, j) => (j === i ? { ...p, a } : p)) });
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <T variant="label">Prompts</T>
        <T variant="small">Pick up to {MAX_PROMPTS}. They give people an easy way to start talking.</T>
      </View>
      {form.prompts.map((p, i) => (
        <Card key={p.q} style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.promptQ}>{p.q}</Text>
            <Pressable onPress={() => set({ prompts: form.prompts.filter((_, j) => j !== i) })} hitSlop={10}
              accessibilityRole="button" accessibilityLabel={`Remove prompt ${p.q}`}>
              <Ionicons name="close-circle" size={22} color={colors.faint} />
            </Pressable>
          </View>
          <Field value={p.a} onChangeText={(a) => answer(i, a)} maxLength={PROMPT_MAX_CHARS} multiline placeholder="Your answer"
            style={{ minHeight: 64 }} accessibilityLabel={`Answer for ${p.q}`} />
        </Card>
      ))}
      {form.prompts.length >= MAX_PROMPTS ? null : picking ? (
        <Choice options={unused.map((q) => ({ value: q, label: q }))} value={null}
          onChange={(q) => { set({ prompts: [...form.prompts, { q, a: "" }] }); setPicking(false); }} />
      ) : (
        <PillButton icon="add" label="Add a prompt" onPress={() => setPicking(true)} color={colors.brand} />
      )}
    </View>
  );
}

export function WhereSection({ form, set, setError }: SectionProps) {
  const [locating, setLocating] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const useGps = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error();
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      set({ latitude: p.coords.latitude, longitude: p.coords.longitude, locationLabel: "Using your current location" });
    } catch {
      setError("Couldn't get your location — pick your city instead.");
      setShowCities(true);
    }
    setLocating(false);
  };
  return (
    <View style={{ gap: 18 }}>
      <Card>
        <T variant="small">We only store your location to about 1 km, and only show others how far away you are.</T>
        <PillButton icon="navigate" color={tile.blue} label={locating ? "Finding you…" : "Use my location"} onPress={useGps} disabled={locating} />
        <Text style={styles.link} onPress={() => setShowCities(!showCities)}>
          {showCities ? "Hide cities" : "Or pick your city"}
        </Text>
        {showCities ? (
          <Choice
            options={CITIES.map((c, i) => ({ value: i, label: c.name }))}
            value={CITIES.findIndex((c) => c.lat === form.latitude && c.lng === form.longitude)}
            onChange={(i) => set({ latitude: CITIES[i].lat, longitude: CITIES[i].lng, locationLabel: CITIES[i].name })}
          />
        ) : null}
        {form.locationLabel ? <Notice tone="info" icon="location" text={form.locationLabel} /> : null}
      </Card>
      <Choice
        label="Show people within"
        options={DISTANCES.map((d) => ({ value: d, label: d === 500 ? "Anywhere" : `${d} km` }))}
        value={form.maxDistanceKm}
        onChange={(v) => set({ maxDistanceKm: v })}
      />
      <View style={{ gap: 6 }}>
        <T variant="label">Aged between</T>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field value={form.ageMin} onChangeText={(v) => set({ ageMin: v.replace(/\D/g, "").slice(0, 3) })} keyboardType="number-pad" accessibilityLabel="Minimum age" />
          </View>
          <T>and</T>
          <View style={{ flex: 1 }}>
            <Field value={form.ageMax} onChangeText={(v) => set({ ageMax: v.replace(/\D/g, "").slice(0, 3) })} keyboardType="number-pad" accessibilityLabel="Maximum age" />
          </View>
        </View>
      </View>
    </View>
  );
}

export function VoiceSection({ form, set, setError }: SectionProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const rec = useAudioRecorderState(recorder);
  const [uploading, setUploading] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = async () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return;
    setUploading(true);
    try {
      set({ voiceIntroUrl: await uploadFile("voice", uri, mimeFor(uri, null, "audio/mp4")) });
    } catch {
      setError("Voice upload failed — try again.");
    }
    setUploading(false);
  };

  const start = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return setError("Microphone access is needed to record your voice intro.");
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    stopTimer.current = setTimeout(stop, MAX_VOICE_MS);
  };

  useEffect(() => () => { if (stopTimer.current) clearTimeout(stopTimer.current); }, []);

  const secs = Math.floor((rec.durationMillis ?? 0) / 1000);
  return (
    <Card>
      <T variant="small">
        Profiles with a voice intro get more replies. Say hi and one fun thing about you (up to 30 seconds).
      </T>
      {form.voiceIntroUrl && !rec.isRecording ? <VoicePlayer url={form.voiceIntroUrl} /> : null}
      {rec.isRecording ? (
        <PillButton icon="stop" label={`Stop recording · 0:${String(secs).padStart(2, "0")}`} onPress={stop} color={colors.danger} />
      ) : (
        <PillButton
          icon="mic"
          label={uploading ? "Uploading…" : form.voiceIntroUrl ? "Re-record" : "Record voice intro"}
          onPress={start}
          disabled={uploading}
          color={colors.brand}
        />
      )}
    </Card>
  );
}

export function VoicePlayer({ url, light }: { url: string; light?: boolean }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const toggle = () => {
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) player.seekTo(0);
      player.play();
    }
  };
  return (
    <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={status.playing ? "Pause voice intro" : "Play voice intro"}
      style={[styles.voice, light && { backgroundColor: "rgba(255,255,255,0.2)" }]}>
      <Ionicons name={status.playing ? "pause" : "play"} size={18} color={light ? colors.white : colors.ink} />
      <Text style={[styles.voiceText, light && { color: colors.white }]}>{status.playing ? "Playing voice intro" : "Play voice intro"}</Text>
    </Pressable>
  );
}

export function VibesSection({ form, set }: SectionProps) {
  const toggle = (list: "traits" | "dealbreakers", v: string) =>
    set({ [list]: form[list].includes(v) ? form[list].filter((x) => x !== v) : [...form[list], v] });
  return (
    <View style={{ gap: 14 }}>
      <Card>
        <T variant="small">Tick what&apos;s true for you. We show people how much you vibe.</T>
        {VIBE_QUESTIONS.map((q) => (
          <Check key={q} label={q} checked={!!form.vibeAnswers[q]} onChange={(v) => set({ vibeAnswers: { ...form.vibeAnswers, [q]: v } })} />
        ))}
      </Card>
      <Card>
        <T variant="label">About me</T>
        <T variant="small">Private. Only used for matching.</T>
        {TRAITS.map((t) => <Check key={t.value} label={t.label} checked={form.traits.includes(t.value)} onChange={() => toggle("traits", t.value)} />)}
      </Card>
      <Card>
        <T variant="label">Don&apos;t show me people who…</T>
        {DEALBREAKERS.map((d) => <Check key={d.value} label={d.label} checked={form.dealbreakers.includes(d.value)} onChange={() => toggle("dealbreakers", d.value)} />)}
      </Card>
    </View>
  );
}

export function PreferencesSection({ form, set }: SectionProps) {
  const opts = [{ value: "", label: "Prefer not to say" }, ...ETHNICITIES.map((e) => ({ value: slug(e), label: e }))];
  return (
    <View style={{ gap: 18 }}>
      <T variant="small">Optional. Never shown on your profile.</T>
      <Choice label="Your ethnicity" options={opts} value={form.ethnicity} onChange={(v) => set({ ethnicity: v })} />
      {form.ethnicity ? (
        <Check checked={form.sensitiveConsent} onChange={(v) => set({ sensitiveConsent: v })}
          label="I consent to Twain storing my ethnicity, which is sensitive personal data, only for matching filters. I can remove it any time." />
      ) : null}
      <Choice
        label="Who do you prefer to see? (private, never shown)"
        options={[{ value: "all", label: "Everyone" }, ...ETHNICITIES.map((e) => ({ value: slug(e), label: e }))]}
        value={form.preferEthnicity}
        onChange={(v) => set({ preferEthnicity: v })}
      />
    </View>
  );
}

export function PillButton({ icon, label, onPress, disabled, color = colors.ink }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean; color?: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={({ pressed }) => [styles.pill, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  promptQ: { flex: 1, fontFamily: font.semibold, fontSize: 14.5, color: colors.ink },
  link: { color: colors.brand, fontFamily: font.medium, fontSize: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "31%", aspectRatio: 3 / 4, borderRadius: 12, overflow: "hidden", backgroundColor: colors.line },
  addTile: { backgroundColor: colors.card, alignItems: "center", justifyContent: "center", gap: 4 },
  addText: { fontFamily: font.medium, fontSize: 12.5, color: colors.brand },
  remove: { position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  mainTag: { position: "absolute", left: 6, bottom: 6, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  mainTagText: { color: colors.white, fontFamily: font.semibold, fontSize: 11 },
  pill: { height: 46, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, backgroundColor: colors.fill },
  pillText: { color: colors.ink, fontFamily: font.semibold, fontSize: 15.5 },
  voice: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", backgroundColor: colors.fill, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  voiceText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
});
