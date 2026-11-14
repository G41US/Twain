import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import type { ScrollViewInstance } from "react-native";
import { NotificationsCard } from "../components/notifications-card";
import {
  AboutSection, formFrom, PhotosSection, PreferencesSection, saveSteps, STEPS, VibesSection, VoiceSection, WelcomeSection, WhereSection,
  type Form, type Step,
} from "../components/profile-form";
import { Button, Notice, Screen, T } from "../components/ui";
import { useProfile } from "../ctx/profile";
import { useSession } from "../ctx/session";
import { colors } from "../lib/theme";

// First-run setup: one step per screen, each saved as you go so nothing is lost if the app closes.
export default function Setup() {
  const { me, refresh } = useProfile();
  const { signOut } = useSession();
  const [form, setForm] = useState<Form>(() => formFrom(me!));
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const scroll = useRef<ScrollViewInstance>(null);

  const set = (p: Partial<Form>) => { setError(""); setForm((f) => ({ ...f, ...p })); };
  const name: Step = STEPS[step];
  const last = step === STEPS.length - 1;
  const props = { form, set, setError };

  const sections: Record<Step, React.ReactNode> = {
    Welcome: <WelcomeSection {...props} />,
    Photos: <PhotosSection {...props} />,
    "About you": <AboutSection {...props} />,
    "Where & who": <WhereSection {...props} />,
    "Voice intro": <VoiceSection {...props} />,
    "Vibe check": <VibesSection {...props} />,
    Preferences: <PreferencesSection {...props} />,
    Notifications: <NotificationsCard />,
  };

  const next = async () => {
    setSaving(true);
    const err = await saveSteps(form, [name]);
    if (err) {
      setSaving(false);
      return setError(err);
    }
    if (last) {
      await refresh(); // profile now complete → navigation switches to the app
      return setSaving(false);
    }
    setSaving(false);
    setStep(step + 1);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.progress} accessibilityLabel={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => <View key={s} style={[styles.bar, i <= step && { backgroundColor: colors.brand }]} />)}
        </View>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <T variant="title">{name}</T>
          {sections[name]}
          {error ? <Notice text={error} /> : null}
        </ScrollView>
        <View style={styles.footer}>
          {step > 0 ? (
            <Button title="Back" variant="outline" style={{ minWidth: 116 }} onPress={() => { setError(""); setStep(step - 1); }} />
          ) : (
            <Button title="Sign out" variant="outline" style={{ minWidth: 116 }} onPress={signOut} />
          )}
          <Button
            title={last ? "Start swiping" : name === "Voice intro" && !form.voiceIntroUrl ? "Skip for now" : "Next"}
            icon={last ? "flame" : undefined}
            style={{ flex: 1 }}
            loading={saving}
            onPress={next}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", gap: 5, paddingHorizontal: 20, paddingTop: 8 },
  bar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.line },
  content: { padding: 20, gap: 18, paddingBottom: 32 },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
});
