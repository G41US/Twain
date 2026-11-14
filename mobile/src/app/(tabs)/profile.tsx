import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NotificationsCard } from "../../components/notifications-card";
import {
  AboutSection, formFrom, PhotosSection, PreferencesSection, saveSteps, VibesSection, VoiceSection, WhereSection,
  type Form, type Step,
} from "../../components/profile-form";
import { Avatar, Button, Card, Notice, Screen, T } from "../../components/ui";
import { useProfile, type Me } from "../../ctx/profile";
import { useSession } from "../../ctx/session";
import { api, mimeFor, uploadFile } from "../../lib/api";
import { API_URL } from "../../lib/config";
import { ask, tell } from "../../lib/dialog";
import { colors, font } from "../../lib/theme";

const SECTIONS: { step: Step; icon: keyof typeof Ionicons.glyphMap }[] = [
  { step: "Photos", icon: "images" },
  { step: "About you", icon: "person" },
  { step: "Where & who", icon: "location" },
  { step: "Voice intro", icon: "mic" },
  { step: "Vibe check", icon: "sparkles" },
  { step: "Preferences", icon: "options" },
];

export default function Profile() {
  const { me, refresh } = useProfile();
  const { signOut } = useSession();
  const [form, setForm] = useState<Form>(() => formFrom(me!));
  const [open, setOpen] = useState<Step | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!me) return null;
  const set = (p: Partial<Form>) => { setError(""); setSaved(false); setDirty(true); setForm((f) => ({ ...f, ...p })); };
  const props = { form, set, setError };
  const bodies: Partial<Record<Step, React.ReactNode>> = {
    Photos: <PhotosSection {...props} />,
    "About you": <AboutSection {...props} />,
    "Where & who": <WhereSection {...props} />,
    "Voice intro": <VoiceSection {...props} />,
    "Vibe check": <VibesSection {...props} />,
    Preferences: <PreferencesSection {...props} />,
  };

  const save = async () => {
    setSaving(true);
    const err = await saveSteps(form, SECTIONS.map((s) => s.step));
    setSaving(false);
    if (err) return setError(err);
    setDirty(false);
    setSaved(true);
    await refresh();
  };

  const remove = async () => {
    if (!(await ask("Delete your account?", "Your profile, photos, matches and messages will be gone for good.", "Delete", true))) return;
    try {
      await api("/api/account", { method: "DELETE" });
      await signOut();
    } catch {
      tell("Couldn't delete your account", "Check your connection and try again.");
    }
  };

  const photo = form.photos[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <View style={styles.avatarRing}>
            <Avatar uri={photo} name={me.name} size={96} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <T variant="title">{me.name || "You"}{form.age ? `, ${form.age}` : ""}</T>
            {me.verified ? <Ionicons name="checkmark-circle" size={22} color={colors.verified} accessibilityLabel="Verified" /> : null}
          </View>
          <T variant="small">{me.email}</T>
        </View>

        {!me.verified ? <Verification me={me} onDone={refresh} /> : null}

        <View style={{ gap: 10 }}>
          {SECTIONS.map(({ step, icon }) => (
            <Card key={step} style={{ padding: 0, overflow: "hidden" }}>
              <Pressable
                onPress={() => setOpen(open === step ? null : step)}
                style={styles.sectionHead}
                accessibilityRole="button"
                accessibilityState={{ expanded: open === step }}
              >
                <View style={styles.sectionIcon}><Ionicons name={icon} size={18} color={colors.brand} /></View>
                <Text style={styles.sectionTitle}>{step}</Text>
                <Ionicons name={open === step ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
              </Pressable>
              {open === step ? <View style={styles.sectionBody}>{bodies[step]}</View> : null}
            </Card>
          ))}
        </View>

        {error ? <Notice text={error} /> : null}
        {saved ? <Notice text="Saved" tone="success" /> : null}
        {dirty ? <Button title="Save changes" icon="checkmark" loading={saving} onPress={save} /> : null}

        <NotificationsCard />

        {me.isAdmin ? (
          <Button title="Admin dashboard" variant="light" icon="shield-checkmark" onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/admin`)} />
        ) : null}

        <View style={styles.links}>
          <Pressable onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/terms`)} accessibilityRole="link"><Text style={styles.link}>Terms</Text></Pressable>
          <Text style={styles.dot}>·</Text>
          <Pressable onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/privacy`)} accessibilityRole="link"><Text style={styles.link}>Privacy</Text></Pressable>
        </View>

        <Button title="Sign out" variant="outline" icon="log-out-outline" onPress={signOut} />
        <Button title="Delete account" variant="ghost" onPress={remove} />
      </ScrollView>
    </Screen>
  );
}

/** Selfie verification: copy a random pose, an admin compares it to your photos. */
function Verification({ me, onDone }: { me: Me; onDone: () => Promise<unknown> }) {
  const [pose, setPose] = useState("");
  const [busy, setBusy] = useState(false);

  if (me.selfieStatus === "pending") {
    return <Notice tone="info" icon="time" text="Your verification selfie is being reviewed." />;
  }

  const getPose = async () => {
    setBusy(true);
    try {
      setPose((await api<{ pose: string }>("/api/verify")).pose);
    } catch {
      tell("Couldn't start verification", "Check your connection and try again.");
    }
    setBusy(false);
  };

  const snap = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return tell("Camera needed", "Allow camera access in Settings to take your selfie.");
    const res = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front, quality: 0.8, allowsEditing: false, mediaTypes: ["images"],
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    setBusy(true);
    try {
      const selfieUrl = await uploadFile("selfie", asset.uri, mimeFor(asset.uri, asset.mimeType));
      await api("/api/verify", { body: { selfieUrl } });
      await onDone();
    } catch {
      tell("Selfie not sent", "Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <Card tint="#EAF5FE" style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="checkmark-circle" size={22} color={colors.verified} />
        <T variant="h2">Get verified</T>
      </View>
      <T variant="small">
        {me.selfieStatus === "rejected" ? "Your last selfie wasn't approved. " : ""}
        Verified profiles get more trust and more matches. Take a selfie copying a pose; we compare it to your photos.
      </T>
      {pose ? (
        <>
          <View style={styles.pose}><Text style={styles.poseText}>{pose}</Text></View>
          <Button title="Take selfie" icon="camera" loading={busy} onPress={snap} />
        </>
      ) : (
        <Button title="Start verification" variant="light" loading={busy} onPress={getPose} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  head: { alignItems: "center", gap: 6, paddingTop: 4 },
  avatarRing: {
    width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: colors.brand, padding: 4,
    alignItems: "center", justifyContent: "center", backgroundColor: colors.white, marginBottom: 6,
  },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  sectionIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#FFE4EC", alignItems: "center", justifyContent: "center" },
  sectionTitle: { flex: 1, fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 18, gap: 16 },
  pose: { backgroundColor: colors.white, borderRadius: 14, padding: 14 },
  poseText: { fontFamily: font.bold, fontSize: 18, color: colors.ink, textAlign: "center" },
  links: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  link: { fontFamily: font.semibold, fontSize: 14, color: colors.muted, textDecorationLine: "underline" },
  dot: { color: colors.muted },
});
