import { Modal, Pressable, Share, StyleSheet, View } from "react-native";
import { ModalFrame } from "./web-frame";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, tile } from "../lib/theme";
import { Button, Grabber, Group, Row, T } from "./ui";

const TIPS = [
  { icon: "people", tint: tile.blue, text: "Meet somewhere public and busy" },
  { icon: "car", tint: tile.green, text: "Get there and home on your own" },
  { icon: "chatbubbles", tint: tile.orange, text: "Tell a friend where you're going" },
  { icon: "wine", tint: tile.purple, text: "Keep your drink and phone with you" },
  { icon: "exit", tint: tile.red, text: "Leave whenever you want" },
] as const;

/** First-date safety checklist, plus a ready-made message to tell a friend the plan. */
export function DateSafetySheet({ name, visible, onClose }: { name: string; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const share = () =>
    Share.share({
      message: `Heads up: I'm meeting ${name} (from Twain) on ___ at ___. I'll message you when I'm home. If you don't hear from me by ___, please call me.`,
    });
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
<ModalFrame>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Grabber />
        <View style={{ gap: 4 }}>
          <T variant="h2">Planning to meet {name}?</T>
          <T variant="small">A few habits that keep first dates relaxed and safe.</T>
        </View>
        <Group footer="Never send money, airtime or bank details to anyone you meet here.">
          {TIPS.map((t, i) => <Row key={t.text} icon={t.icon} tint={t.tint} title={t.text} last={i === TIPS.length - 1} />)}
        </Group>
        <Button title="Tell a friend the plan" icon="share-outline" onPress={share} />
        <Button title="Done" variant="ghost" onPress={onClose} style={{ marginTop: -6 }} />
      </View>
    </ModalFrame>
</Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingHorizontal: 16, paddingTop: 8, gap: 14 },
});
