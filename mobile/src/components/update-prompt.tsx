import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";
import { getContentUriAsync } from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { useEffect, useState } from "react";
import { Linking, Modal, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../lib/config";
import { tell } from "../lib/dialog";
import { colors, font } from "../lib/theme";
import { Button, Grabber, T } from "./ui";

type Latest = { versionCode: number; version: string; notes?: string; url: string; minVersionCode?: number };

// Installed build, from app.json baked into the app.
export const installedVersion = Constants.expoConfig?.version ?? "";
const installed = Constants.expoConfig?.android?.versionCode ?? 0;
const supported = Platform.OS === "android" && installed > 0; // iPhone updates come from the App Store

let open: ((l: Latest) => void) | null = null;

/** Looks for a newer APK (API_URL/app-version.json → latest GitHub release). Shows the update sheet if there is one. */
export async function checkForUpdate(manual = false) {
  if (!supported) return manual ? tell("Updates", "Updates are installed from the app store on this device.") : undefined;
  try {
    const r = await fetch(`${API_URL}/app-version.json`, { cache: "no-store" });
    const l: Latest | null = r.ok ? await r.json() : null;
    if (l && typeof l.versionCode === "number" && typeof l.url === "string" && l.versionCode > installed) return open?.(l);
    if (manual) tell("You're up to date", `Twain ${installedVersion} is the newest version.`);
  } catch {
    if (manual) tell("Couldn't check for updates", "Check your connection and try again.");
  }
}

/** Update sheet: downloads the new APK inside the app, then hands it to Android's installer. */
export function UpdatePrompt() {
  const insets = useSafeAreaInsets();
  const [latest, setLatest] = useState<Latest | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState<number | null>(null); // null = not downloading

  useEffect(() => {
    open = (l) => { setLatest(l); setVisible(true); };
    checkForUpdate();
    return () => { open = null; };
  }, []);

  if (!latest) return null;
  const required = installed < (latest.minVersionCode ?? 0);
  const downloading = progress !== null;

  const install = async () => {
    setProgress(0);
    try {
      const apk = new File(Paths.cache, "twain-update.apk");
      if (apk.exists) apk.delete();
      await File.downloadFileAsync(latest.url, apk, {
        idempotent: true,
        onProgress: ({ bytesWritten, totalBytes }) => totalBytes > 0 && setProgress(bytesWritten / totalBytes),
      });
      // Android may first ask to "allow installs from Twain"; after that it shows its Update screen.
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: await getContentUriAsync(apk.uri),
        type: "application/vnd.android.package-archive",
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      });
    } catch {
      // Fallback: let the browser download it.
      Linking.openURL(latest.url);
    }
    setProgress(null);
  };

  return (
    <Modal visible={visible || required} transparent animationType="slide" onRequestClose={() => { if (!required && !downloading) setVisible(false); }}>
      <View style={styles.backdrop} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Grabber />
        <View style={styles.icon}>
          <Ionicons name="arrow-down-circle" size={34} color={colors.brand} />
        </View>
        <T variant="h2" style={{ textAlign: "center" }}>{required ? "Please update Twain" : "A new Twain is here"}</T>
        <T variant="small" style={{ textAlign: "center" }}>
          Version {latest.version}
          {latest.notes ? `. ${latest.notes}` : ""}
        </T>
        {downloading ? (
          <View style={{ gap: 8, paddingVertical: 6 }} accessibilityRole="progressbar" accessibilityValue={{ now: Math.round(progress * 100), min: 0, max: 100 }}>
            <View style={styles.track}><View style={[styles.bar, { width: `${Math.max(4, progress * 100)}%` }]} /></View>
            <T variant="small" style={{ textAlign: "center", fontFamily: font.medium }}>Downloading… {Math.round(progress * 100)}%</T>
          </View>
        ) : (
          <Button title="Update now" icon="download-outline" onPress={install} />
        )}
        {required || downloading ? null : <Button title="Later" variant="ghost" onPress={() => setVisible(false)} />}
        <T variant="small" style={{ textAlign: "center" }}>Your matches and chats stay. Tap Update when Android asks.</T>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  icon: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandTint, alignItems: "center", justifyContent: "center" },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.fill, overflow: "hidden" },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.brand },
});
