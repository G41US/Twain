import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Linking, Modal, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../lib/config";
import { colors } from "../lib/theme";
import { Button, Grabber, T } from "./ui";

type Latest = { versionCode: number; version: string; notes?: string; url: string; minVersionCode?: number };

// Installed build number, from app.json (android.versionCode) baked into the app.
const installed = Constants.expoConfig?.android?.versionCode ?? 0;

/** On launch, offers the newest APK if this build is older (published at API_URL/app-version.json). */
export function UpdatePrompt() {
  const insets = useSafeAreaInsets();
  const [latest, setLatest] = useState<Latest | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios" || !installed) return; // iPhone updates come from the App Store; no build number = web/dev
    fetch(`${API_URL}/app-version.json`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((l: Latest | null) => {
        if (l && typeof l.versionCode === "number" && typeof l.url === "string" && l.versionCode > installed) setLatest(l);
      })
      .catch(() => {}); // offline: try again next launch
  }, []);

  if (!latest) return null;
  const required = installed < (latest.minVersionCode ?? 0);

  return (
    <Modal visible={!dismissed || required} transparent animationType="slide" onRequestClose={() => { if (!required) setDismissed(true); }}>
      <View style={styles.backdrop} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Grabber />
        <View style={styles.icon}>
          <Ionicons name="arrow-down-circle" size={34} color={colors.brand} />
        </View>
        <T variant="h2" style={{ textAlign: "center" }}>
          {required ? "Please update Twain" : "A new Twain is here"}
        </T>
        <T variant="small" style={{ textAlign: "center" }}>
          Version {latest.version}
          {latest.notes ? ` · ${latest.notes}` : ""}
        </T>
        <Button title="Update now" icon="download-outline" onPress={() => Linking.openURL(latest.url)} />
        {required ? null : <Button title="Later" variant="ghost" onPress={() => setDismissed(true)} />}
        <T variant="small" style={{ textAlign: "center" }}>
          Open the download when it finishes and tap Update. Your matches and chats stay.
        </T>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  icon: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandTint, alignItems: "center", justifyContent: "center" },
});
