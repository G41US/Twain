import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, Animated, Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui";
import { API_URL } from "../lib/config";
import { googleEnabled, signInWithGoogle } from "../lib/google";
import { colors, font } from "../lib/theme";

// Unsplash License (free for commercial use): Suad Kamardeen (1, 2), Baptista Ime James (3), Isaiah McClean (4).
// Each card: photo, then left edge, width and top in collage units (one unit ≈ screen width on tall phones), tilt.
const COLLAGE = [
  { src: require("../../assets/images/welcome-2.jpg"), x: 0.47, w: 0.5, y: 0.035, tilt: "7deg" },
  { src: require("../../assets/images/welcome-1.jpg"), x: -0.05, w: 0.56, y: 0.07, tilt: "-6deg" },
  { src: require("../../assets/images/welcome-4.jpg"), x: 0.5, w: 0.47, y: 0.33, tilt: "-4deg" },
  { src: require("../../assets/images/welcome-3.jpg"), x: 0.06, w: 0.44, y: 0.37, tilt: "5deg" },
] as const;

function Collage() {
  const { width, height } = useWindowDimensions();
  // Shrink on short or wide screens so the photos always end above the logo and buttons.
  // The lowest card ends ~1.4 units down; ~330px at the bottom belongs to the logo, tagline and buttons.
  const u = Math.min(width, (height - 330) / 1.35);
  const offset = (width - u) / 2;
  const [fades] = useState(() => COLLAGE.map(() => new Animated.Value(0)));
  useEffect(() => {
    Animated.stagger(140, fades.map((v) => Animated.timing(v, { toValue: 1, duration: 600, useNativeDriver: true }))).start();
  }, [fades]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {COLLAGE.map((c, i) => (
        <Animated.View
          key={i}
          style={[
            styles.card,
            {
              left: offset + c.x * u, top: c.y * 2.2 * u, width: c.w * u, height: c.w * u * (4 / 3),
              opacity: fades[i],
              transform: [{ rotate: c.tilt }, { translateY: fades[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            },
          ]}
        >
          <Image source={c.src} style={styles.cardPhoto} contentFit="cover" accessibilityIgnoresInvertColors />
        </Animated.View>
      ))}
    </View>
  );
}

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
      <Collage />
      {/* Fade: dimmed at the top (status bar legibility), photos clear in the middle, deep plum behind the buttons. */}
      <LinearGradient
        colors={["rgba(20,10,24,0.6)", "rgba(20,10,24,0.1)", "rgba(20,10,24,0.2)", "rgba(20,10,24,0.85)", colors.plum]}
        locations={[0, 0.16, 0.42, 0.62, 0.78]}
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
  card: {
    position: "absolute", borderRadius: 26, padding: 5, backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  cardPhoto: { flex: 1, borderRadius: 21, backgroundColor: "#2A1830" },
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
