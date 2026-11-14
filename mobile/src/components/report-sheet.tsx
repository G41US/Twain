import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { tell } from "../lib/dialog";
import { colors } from "../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, Grabber, Group, Row, T } from "./ui";

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
        <Grabber />
        <View style={{ gap: 4 }}>
          <T variant="h2">Report {target?.name ?? "this person"}</T>
          <T variant="small">They won&apos;t know you reported them.</T>
        </View>
        <Group>
          {REASONS.map((r, i) => (
            <Row key={r.value} title={r.label} onPress={() => setReason(r.value)} chevron={false} last={i === REASONS.length - 1}
              right={reason === r.value ? <Ionicons name="checkmark" size={20} color={colors.brand} /> : null} />
          ))}
        </Group>
        <Field value={details} onChangeText={setDetails} placeholder="Anything else we should know? (optional)" maxLength={300} multiline />
        <Button title="Send report" variant="danger" onPress={send} loading={busy} disabled={!reason} />
        <Button title="Cancel" variant="ghost" onPress={() => close(false)} style={{ marginTop: -6 }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingHorizontal: 16, paddingTop: 8, gap: 14 },
});
