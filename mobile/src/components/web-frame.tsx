import type { ReactNode } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { colors } from "../lib/theme";

// Phone browsers get the app edge to edge. Computers get a desktop layout on every screen
// (split welcome, sidebar, wide content column); tablet-sized windows get a centred phone column.
// Native: renders children untouched.
const MAX = 480;
const WIDE = 900; // px of browser width where the desktop layout starts
export const CONTENT = 760; // desktop content column

/** True in a computer-sized browser window. */
export function useWide() {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= WIDE;
}

export function WebFrame({ children }: { children: ReactNode }) {
  const wide = useWide();
  if (Platform.OS !== "web") return children;
  return (
    <View style={styles.page}>
      <View style={wide ? styles.full : styles.app}>{children}</View>
    </View>
  );
}

/** Window size, but on the web the phone column's width (screens that size things from the width use this). */
export function useAppSize() {
  const { width, height } = useWindowDimensions();
  return { width: Platform.OS === "web" ? Math.min(width, MAX) : width, height };
}

/**
 * Wraps modal content on the web (web modals cover the whole browser window).
 * Phone browsers: the phone column. Computers: a centred card over a dimmed page;
 * `tall` gives the card a fixed height for full-screen editors, `inline` keeps it over the content column (popover menus).
 */
export function ModalFrame({ children, tall, inline }: { children: ReactNode; tall?: boolean; inline?: boolean }) {
  const wide = useWide();
  if (Platform.OS !== "web") return children;
  if (!wide) return <View style={styles.modal}>{children}</View>;
  if (inline) return <View style={[styles.modal, { maxWidth: CONTENT }]}>{children}</View>;
  return (
    <View style={styles.dim}>
      <View style={[styles.card, tall && styles.tall]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#E5E5EA" },
  app: {
    flex: 1, width: "100%", maxWidth: MAX, alignSelf: "center", backgroundColor: colors.bg, overflow: "hidden",
    boxShadow: "0 0 40px rgba(0,0,0,0.12)",
  },
  full: { flex: 1, backgroundColor: colors.bg },
  modal: { flex: 1, width: "100%", maxWidth: MAX, alignSelf: "center" },
  dim: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%", maxWidth: MAX, maxHeight: "90%", borderRadius: 16, overflow: "hidden", backgroundColor: colors.bg,
    boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
  },
  tall: { height: 760 },
});
