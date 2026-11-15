import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ModalFrame, useWide } from "../../components/web-frame";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationsCard } from "../../components/notifications-card";
import { checkForUpdate, installedVersion } from "../../components/update-prompt";
import {
  AboutSection, formFrom, PhotosSection, PreferencesSection, saveSteps, VibesSection, VoiceSection, WhereSection,
  type Form, type Step,
} from "../../components/profile-form";
import { Button, Group, Notice, Row, Screen, T } from "../../components/ui";
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
  const [open, setOpen] = useState<Step | "Verify" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const wide = useWide();
  const web = Platform.OS === "web";

  if (!me) return null;
  const set = (p: Partial<Form>) => { setError(""); setForm((f) => ({ ...f, ...p })); };
  const props = { form, set, setError };
  const bodies: Partial<Record<Step, React.ReactNode>> = {
    Photos: <PhotosSection {...props} />,
    "About you": <AboutSection {...props} />,
    "Where & who": <WhereSection {...props} />,
    "Voice intro": <VoiceSection {...props} />,
    "Vibe check": <VibesSection {...props} />,
    Preferences: <PreferencesSection {...props} />,
  };
  const values: Partial<Record<Step, string>> = {
    Photos: `${form.photos.length}`,
    "About you": form.age ? `${form.age}` : "",
    "Where & who": `${form.maxDistanceKm} km`,
    "Voice intro": form.voiceIntroUrl ? "Recorded" : "Add",
  };

  const close = () => { setOpen(null); setError(""); setForm(formFrom(me)); };
  const save = async () => {
    if (!open || open === "Verify") return;
    setSaving(true);
    const err = await saveSteps(form, [open]);
    setSaving(false);
    if (err) return setError(err);
    setOpen(null);
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

  const link = (path: string) => () => WebBrowser.openBrowserAsync(`${API_URL}${path}`);
  const verifyValue = me.verified ? "Verified" : me.selfieStatus === "pending" ? "In review" : "";

  // What makes a profile get replies; the first unfinished one is suggested next.
  const checklist: { done: boolean; label: string; step: Step | "Verify" }[] = [
    { done: me.photos.length >= 3, label: "add at least 3 photos", step: "Photos" },
    { done: !!me.prompts?.length, label: "answer a prompt", step: "About you" },
    { done: !!me.voiceIntroUrl, label: "record a voice intro", step: "Voice intro" },
    { done: !!me.vibeAnswers && Object.keys(me.vibeAnswers).length > 0, label: "do the vibe check", step: "Vibe check" },
    { done: me.verified || me.selfieStatus === "pending", label: "get verified", step: "Verify" },
  ];
  const todo = checklist.filter((c) => !c.done);
  const percent = Math.round(((checklist.length - todo.length) / checklist.length) * 60) + 40; // a finished sign-up starts at 40%

  // Computers: you on the left, settings on the right.
  const you = (
    <>
        <Pressable onPress={() => setOpen("Photos")} accessibilityRole="button" accessibilityLabel="Edit photos" style={styles.hero}>
          {form.photos[0] ? <Image source={form.photos[0]} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <LinearGradient colors={["transparent", "rgba(20,10,24,0.85)"]} style={styles.heroShade} />
          <View style={styles.heroEdit}><Ionicons name="camera" size={15} color={colors.white} /><Text style={styles.heroEditText}>Edit photos</Text></View>
          <View style={styles.heroInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.meName} numberOfLines={1}>{me.name || "You"}{me.age ? `, ${me.age}` : ""}</Text>
              {me.verified ? <Ionicons name="checkmark-circle" size={20} color={colors.white} accessibilityLabel="Verified" /> : null}
            </View>
            <Text style={styles.meSub} numberOfLines={1}>{me.email}</Text>
          </View>
        </Pressable>

        {todo.length ? (
          <Pressable onPress={() => setOpen(todo[0].step)} accessibilityRole="button" style={({ pressed }) => [styles.progress, pressed && { backgroundColor: colors.pressed }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={styles.progressTitle}>Your profile is {percent}% complete</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.faint} />
            </View>
            <View style={styles.track}><View style={[styles.fillBar, { width: `${percent}%` }]} /></View>
            <Text style={styles.progressNext}>Next: {todo[0].label}</Text>
          </Pressable>
        ) : null}

        <Group footer={me.verified ? undefined : "Verified profiles get more trust and more matches."}>
          <Row icon="checkmark-circle" title="Verification" value={verifyValue} last
            onPress={me.verified || me.selfieStatus === "pending" ? undefined : () => setOpen("Verify")} chevron={!me.verified && me.selfieStatus !== "pending"} />
        </Group>
    </>
  );
  const settings = (
    <>

        <Group header="Your profile">
          {SECTIONS.map(({ step, icon }, i) => (
            <Row key={step} icon={icon} title={step} value={values[step]} onPress={() => setOpen(step)} last={i === SECTIONS.length - 1} />
          ))}
        </Group>

        {web ? null : <NotificationsCard />}

        <Group>
          {me.isAdmin ? <Row icon="shield-checkmark" title="Admin dashboard" onPress={link("/admin")} /> : null}
          <Row icon="document-text" title="Terms" onPress={link("/terms")} />
          <Row icon="lock-closed" title="Privacy" onPress={link("/privacy")} last />
        </Group>

        {web ? null : (
          <Group footer={`Twain ${installedVersion}`}>
            <Row icon="arrow-down-circle" title="Check for updates" onPress={() => checkForUpdate(true)} last />
          </Group>
        )}

        <Group>
          <Row title="Sign out" onPress={signOut} chevron={false} />
          <Row title="Delete account" onPress={remove} chevron={false} destructive last />
        </Group>
    </>
  );

  return (
    <Screen max={wide ? 1000 : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <T variant="title" style={{ marginLeft: 4 }}>Profile</T>
        {wide ? (
          <View style={styles.columns}>
            <View style={styles.left}>{you}</View>
            <View style={styles.right}>{settings}</View>
          </View>
        ) : <>{you}{settings}</>}
      </ScrollView>

      <EditSheet
        title={open ?? ""}
        visible={!!open}
        onCancel={close}
        onSave={open && open !== "Verify" ? save : undefined}
        saving={saving}
      >
        {open === "Verify" ? <Verification me={me} onDone={async () => { await refresh(); setOpen(null); }} /> : open ? bodies[open] : null}
        {error ? <Notice text={error} /> : null}
      </EditSheet>
    </Screen>
  );
}

/** iOS edit sheet: Cancel · Title · Save. */
function EditSheet({ title, visible, onCancel, onSave, saving, children }: {
  title: string; visible: boolean; onCancel: () => void; onSave?: () => void; saving: boolean; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent={Platform.OS === "web"} animationType="slide" presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"} onRequestClose={onCancel}>
<ModalFrame tall>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === "ios" ? 0 : insets.top }}>
        <View style={styles.sheetBar}>
          <Pressable onPress={onCancel} hitSlop={10} accessibilityRole="button" style={styles.sheetSide}>
            <Text style={styles.sheetAction}>{onSave ? "Cancel" : "Done"}</Text>
          </Pressable>
          <Text style={styles.sheetTitle} numberOfLines={1}>{title === "Verify" ? "Get verified" : title}</Text>
          <View style={[styles.sheetSide, { alignItems: "flex-end" }]}>
            {onSave ? (
              saving ? <ActivityIndicator color={colors.brand} /> : (
                <Pressable onPress={onSave} hitSlop={10} accessibilityRole="button">
                  <Text style={[styles.sheetAction, { fontFamily: font.bold }]}>Save</Text>
                </Pressable>
              )
            ) : null}
          </View>
        </View>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={[styles.sheetBody, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ModalFrame>
</Modal>
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
    <View style={{ gap: 14 }}>
      <T variant="small">
        {me.selfieStatus === "rejected" ? "Your last selfie wasn't approved. " : ""}
        Take a selfie copying a pose we give you. We compare it with your photos, usually within a day.
      </T>
      {pose ? (
        <>
          <View style={styles.pose}><Text style={styles.poseText}>{pose}</Text></View>
          <Button title="Take selfie" icon="camera" loading={busy} onPress={snap} />
        </>
      ) : (
        <Button title="Get a pose" loading={busy} onPress={getPose} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 24 },
  hero: { height: 340, borderRadius: 24, overflow: "hidden", backgroundColor: colors.plum, marginTop: -8 },
  heroShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 170 },
  heroInfo: { position: "absolute", left: 18, right: 18, bottom: 16 },
  heroEdit: { position: "absolute", top: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(20,10,24,0.55)", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  heroEditText: { fontFamily: font.semibold, fontSize: 13, color: colors.white },
  progress: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10, marginTop: -8 },
  progressTitle: { fontFamily: font.bold, fontSize: 15.5, color: colors.ink, letterSpacing: -0.2 },
  progressNext: { fontFamily: font.medium, fontSize: 13.5, color: colors.brand },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.bg, overflow: "hidden" },
  fillBar: { height: 6, borderRadius: 3, backgroundColor: colors.brand },
  meName: { fontFamily: font.black, fontSize: 28, color: colors.white, flexShrink: 1, letterSpacing: -0.8 },
  columns: { flexDirection: "row", gap: 28, alignItems: "flex-start" },
  left: { width: 340, gap: 24 },
  right: { flex: 1, gap: 24, minWidth: 0 },
  meSub: { fontFamily: font.medium, fontSize: 13.5, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  pose: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  poseText: { fontFamily: font.bold, fontSize: 18, color: colors.ink, textAlign: "center" },
  sheetBar: {
    flexDirection: "row", alignItems: "center", height: 56, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline, backgroundColor: colors.bar,
  },
  sheetSide: { width: 72 },
  sheetTitle: { flex: 1, textAlign: "center", fontFamily: font.semibold, fontSize: 17, color: colors.ink },
  sheetAction: { fontFamily: font.regular, fontSize: 17, color: colors.brand },
  sheetBody: { padding: 16, gap: 18 },
});
