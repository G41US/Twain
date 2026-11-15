import type { ReactNode } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { colors } from "../lib/theme";

// On computers the app sits in a centred phone-width column instead of stretching across the screen.
// Native: renders children untouched.
const MAX = 480;

export function WebFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== "web") return children;
  return (
    <View style={styles.page}>
      <View style={styles.app}>{children}</View>
    </View>
  );
}

/** Window size, but on the web the app column's width (screens that size things from the width use this). */
export function useAppSize() {
  const { width, height } = useWindowDimensions();
  return { width: Platform.OS === "web" ? Math.min(width, MAX) : width, height };
}

/** Same column for modal content (web modals cover the whole browser window). */
export function ModalFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== "web") return children;
  return <View style={styles.modal}>{children}</View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#E5E5EA" },
  app: {
    flex: 1, width: "100%", maxWidth: MAX, alignSelf: "center", backgroundColor: colors.bg, overflow: "hidden",
    boxShadow: "0 0 40px rgba(0,0,0,0.12)",
  },
  modal: { flex: 1, width: "100%", maxWidth: MAX, alignSelf: "center" },
});
