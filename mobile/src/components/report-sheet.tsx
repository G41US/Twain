import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { tell } from "../lib/dialog";
import { colors } from "../lib/theme";
import { Button, Choice, Field, T } from "./ui";

const REASONS = [
  "Fake profile / stolen photos",
  "Asked me for money",
  "Nudity or sexual content",
  "Harassment or threats",
  "May be under 18",
  "Other",
].map((r) => ({ value: r, label: r }));

/** Bottom sheet to report someone. Calls onDone(true) after a report is sent. */
export function ReportSheet({ target, onDone }: { target: { id: string; name: string | null } | null; onDone: (sent: boolean) => void }) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const close = (sent: boolean) => {
    setReason("");
    setDetails("");
    onDone(sent);
  };

  const send = async () => {
    if (!target || !reason) return;
    setBusy(true);
    try {
      await api("/api/report", { body: { targetId: target.id, reason: details.trim() ? `${reason}: ${details.trim()}` : reason } });
      tell("Thanks for telling us", "Our team will review this profile.");
      close(true);
    } catch {
      tell("Couldn't send your report", "Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={() => close(false)}>
      <Pressable style={styles.backdrop} onPress={() => close(false)} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <T variant="h2">Report {target?.name ?? "this person"}</T>
        <T variant="small">They won&apos;t know you reported them.</T>
        <Choice options={REASONS} value={reason} onChange={setReason} />
        <Field value={details} onChangeText={setDetails} placeholder="Anything else we should know? (optional)" maxLength={300} multiline />
        <Button title="Send report" variant="danger" onPress={send} loading={busy} disabled={!reason} />
        <Button title="Cancel" variant="ghost" onPress={() => close(false)} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 },
});
