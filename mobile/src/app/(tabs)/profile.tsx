import { Ionicons } from "@expo/vector-icons";
import { ModalFrame } from "../../components/web-frame";
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
import { Avatar, Button, Group, Notice, Row, Screen, T } from "../../components/ui";
import { useProfile, type Me } from "../../ctx/profile";
import { useSession } from "../../ctx/session";
import { api, mimeFor, uploadFile } from "../../lib/api";
import { API_URL } from "../../lib/config";
import { ask, tell } from "../../lib/dialog";
import { colors, font, tile } from "../../lib/theme";

const SECTIONS: { step: Step; icon: keyof typeof Ionicons.glyphMap; tint: string }[] = [
  { step: "Photos", icon: "images", tint: tile.orange },
  { step: "About you", icon: "person", tint: tile.blue },
  { step: "Where & who", icon: "location", tint: tile.green },
  { step: "Voice intro", icon: "mic", tint: tile.red },
  { step: "Vibe check", icon: "sparkles", tint: tile.purple },
  { step: "Preferences", icon: "options", tint: tile.gray },
];

export default function Profile() {
  const { me, refresh } = useProfile();
  const { signOut } = useSession();
  const [form, setForm] = useState<Form>(() => formFrom(me!));
  const [open, setOpen] = useState<Step | "Verify" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <T variant="title" style={{ marginLeft: 4 }}>Profile</T>

        <Pressable onPress={() => setOpen("Photos")} accessibilityRole="button" accessibilityLabel="Edit photos"
          style={({ pressed }) => [styles.me, pressed && { backgroundColor: "#E5E5EA" }]}>
          <Avatar uri={form.photos[0]} name={me.name} size={62} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={styles.meName} numberOfLines={1}>{me.name || "You"}{me.age ? `, ${me.age}` : ""}</Text>
              {me.verified ? <Ionicons name="checkmark-circle" size={18} color={colors.verified} accessibilityLabel="Verified" /> : null}
            </View>
            <Text style={styles.meSub} numberOfLines={1}>{me.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.hairline} />
        </Pressable>

        <Group footer={me.verified ? undefined : "Verified profiles get more trust and more matches."}>
          <Row icon="checkmark-circle" tint={tile.blue} title="Verification" value={verifyValue} last
            onPress={me.verified || me.selfieStatus === "pending" ? undefined : () => setOpen("Verify")} chevron={!me.verified && me.selfieStatus !== "pending"} />
        </Group>

        <Group header="Your profile">
          {SECTIONS.map(({ step, icon, tint }, i) => (
            <Row key={step} icon={icon} tint={tint} title={step} value={values[step]} onPress={() => setOpen(step)} last={i === SECTIONS.length - 1} />
          ))}
        </Group>

        <NotificationsCard />

        <Group>
          {me.isAdmin ? <Row icon="shield-checkmark" tint={tile.indigo} title="Admin dashboard" onPress={link("/admin")} /> : null}
          <Row icon="document-text" tint={tile.gray} title="Terms" onPress={link("/terms")} />
          <Row icon="lock-closed" tint={tile.gray} title="Privacy" onPress={link("/privacy")} last />
        </Group>

        <Group footer={`Twain ${installedVersion}`}>
          <Row icon="arrow-down-circle" tint={tile.green} title="Check for updates" onPress={() => checkForUpdate(true)} last />
        </Group>

        <Group>
          <Row title="Sign out" onPress={signOut} chevron={false} />
          <Row title="Delete account" onPress={remove} chevron={false} destructive last />
        </Group>
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
  me: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 12, padding: 14, marginTop: -8 },
  meName: { fontFamily: font.semibold, fontSize: 20, color: colors.ink, flexShrink: 1, letterSpacing: -0.3 },
  meSub: { fontFamily: font.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
  pose: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  poseText: { fontFamily: font.bold, fontSize: 18, color: colors.ink, textAlign: "center" },
  sheetBar: {
    flexDirection: "row", alignItems: "center", height: 56, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline, backgroundColor: "#F9F9F9",
  },
  sheetSide: { width: 72 },
  sheetTitle: { flex: 1, textAlign: "center", fontFamily: font.semibold, fontSize: 17, color: colors.ink },
  sheetAction: { fontFamily: font.regular, fontSize: 17, color: colors.brand },
  sheetBody: { padding: 16, gap: 18 },
});
