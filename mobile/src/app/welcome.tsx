import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui";
import { API_URL } from "../lib/config";
import { googleEnabled, signInWithGoogle } from "../lib/google";
import { colors, font } from "../lib/theme";

// Photo: Brian Kungu on Unsplash (Unsplash License — free for commercial use).
const photo = require("../../assets/images/welcome.jpg");

export default function Welcome() {
  const [google, setGoogle] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    googleEnabled().then(setGoogle);
  }, []);

  const onGoogle = async () => {
    if (!google) {
      const msg = "Google sign-in is being set up. Use your email for now — it only takes a minute.";
      return Platform.OS === "web" ? window.alert(msg) : Alert.alert("Almost there", msg);
    }
    setBusy(true);
    const err = await signInWithGoogle();
    setBusy(false);
    if (err && err !== "cancel") Alert.alert("Couldn't sign in", err);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} accessibilityIgnoresInvertColors />
      {/* Fade: soft at the top (status bar legibility), clear in the middle, deep plum behind the buttons. */}
      <LinearGradient
        colors={["rgba(20,10,24,0.55)", "rgba(20,10,24,0.15)", "rgba(20,10,24,0.75)", colors.plum]}
        locations={[0, 0.3, 0.62, 0.9]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🇳🇬  Made for Nigeria</Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.logo} accessibilityRole="header">
            Twain<Text style={{ color: colors.brand }}>.</Text>
          </Text>
          <Text style={styles.tagline}>Real people. Real vibes.{"\n"}People who actually reply.</Text>

          <View style={styles.buttons}>
            <Button title="Continue with Google" icon="logo-google" variant="light" onPress={onGoogle} loading={busy} />
            <Button title="Continue with email" icon="mail" onPress={() => router.push("/email")} />
          </View>

          <Text style={styles.legal}>
            18+ only. By continuing you agree to our{" "}
            <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/terms`)}>Terms</Text> and{" "}
            <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/privacy`)}>Privacy Policy</Text>.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.plum },
  safe: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24 },
  badge: {
    alignSelf: "center", marginTop: 12, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  badgeText: { color: colors.white, fontFamily: font.semibold, fontSize: 13 },
  bottom: { paddingBottom: 12, gap: 14 },
  logo: { color: colors.white, fontFamily: font.black, fontSize: 64, letterSpacing: -2, lineHeight: 72 },
  tagline: { color: "rgba(255,255,255,0.88)", fontFamily: font.medium, fontSize: 18, lineHeight: 26 },
  buttons: { gap: 12, marginTop: 14 },
  legal: { color: "rgba(255,255,255,0.65)", fontFamily: font.regular, fontSize: 12.5, lineHeight: 18, textAlign: "center", marginTop: 4 },
  link: { color: colors.white, fontFamily: font.semibold, textDecorationLine: "underline" },
});
