import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, font } from "../lib/theme";
import { CONTENT, useWide } from "./web-frame";

type IconName = keyof typeof Ionicons.glyphMap;

/** Page wrapper: keeps content clear of the status bar / notch / gesture bar. */
/** `narrow`: a slimmer column on computers, for forms. */
export function Screen({ children, edges = ["top"], style, narrow }: { children: ReactNode; edges?: Edge[]; style?: StyleProp<ViewStyle>; narrow?: boolean }) {
  const wide = useWide();
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: colors.bg }, !wide && style]}>
      {/* Computers: content in a centred column; the screen's own background colours the column only. */}
      {wide ? <View style={[{ flex: 1, width: "100%", maxWidth: narrow ? 560 : CONTENT, alignSelf: "center", paddingTop: narrow ? 32 : 0 }, style]}>{children}</View> : children}
    </SafeAreaView>
  );
}

/** Type scale modelled on iOS: large title, title, headline, body, footnote. */
export function T({ children, style, variant = "body", numberOfLines }: {
  children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number;
  variant?: "title" | "h2" | "body" | "small" | "label";
}) {
  return <Text numberOfLines={numberOfLines} style={[styles[variant], style]}>{children}</Text>;
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  /** primary: rose. secondary: grey fill. light: white (on photos/dark). ghost: rose text. danger: red text on red tint. clear: white text. */
  variant?: "primary" | "secondary" | "light" | "ghost" | "danger" | "clear";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const BUTTON = {
  primary: { bg: colors.brand, fg: colors.white },
  secondary: { bg: colors.fill, fg: colors.ink },
  light: { bg: colors.white, fg: colors.ink },
  ghost: { bg: "transparent", fg: colors.brand },
  danger: { bg: "rgba(255,59,48,0.12)", fg: colors.danger },
  clear: { bg: "transparent", fg: colors.white },
} as const;

export function Button({ title, onPress, variant = "primary", icon, loading, disabled, style }: ButtonProps) {
  const off = disabled || loading;
  const v = BUTTON[variant];
  // Disabled filled buttons go grey (iOS), not a faded version of themselves.
  const filled = variant === "primary" || variant === "danger";
  const dim = off && !loading;
  const bg = dim && filled ? colors.fill : v.bg;
  const fg = dim ? colors.faint : v.fg;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: pressed ? 0.7 : 1 }, style]}
    >
      <View style={styles.buttonInner}>
        {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={19} color={fg} /> : null}
        <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label ? <T variant="label">{label}</T> : null}
      <TextInput placeholderTextColor={colors.faint} {...rest} style={[styles.field, rest.multiline && { minHeight: 110, textAlignVertical: "top" }, style]} />
    </View>
  );
}

/** iOS-style round checkmark. */
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} style={styles.checkRow}>
      <Ionicons name={checked ? "checkmark-circle" : "ellipse-outline"} size={26} color={checked ? colors.brand : colors.hairline} />
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

/** A row of tappable choices (single select). */
export function Choice<V extends string | number>({ options, value, onChange, label }: {
  options: { value: V; label: string }[]; value: V | null | undefined; onChange: (v: V) => void; label?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <T variant="label">{label}</T> : null}
      <View style={styles.chips}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && { backgroundColor: colors.ink }]}
            >
              <Text style={[styles.chipText, on && { color: colors.white }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Plain white surface. Use Group for lists of rows. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** iOS inset grouped list: optional header and footer around white rows. */
export function Group({ header, footer, children, style }: { header?: string; footer?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      {header ? <Text style={styles.groupHeader}>{header}</Text> : null}
      <View style={styles.group}>{children}</View>
      {footer ? <Text style={styles.groupFooter}>{footer}</Text> : null}
    </View>
  );
}

/** Settings-style row: coloured icon tile, title, optional value and chevron. */
export function Row({ icon, tint, title, value, onPress, destructive, last, chevron = !!onPress, right }: {
  icon?: IconName; tint?: string; title: string; value?: string; onPress?: () => void;
  destructive?: boolean; last?: boolean; chevron?: boolean; right?: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: "#E5E5EA" }]}>
      {icon ? (
        <View style={[styles.tile, { backgroundColor: tint ?? colors.muted }]}>
          <Ionicons name={icon} size={17} color={colors.white} />
        </View>
      ) : null}
      <View style={[styles.rowBody, !last && styles.rowLine]}>
        <Text style={[styles.rowTitle, destructive && { color: colors.danger }]} numberOfLines={1}>{title}</Text>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
        {right}
        {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.hairline} /> : null}
      </View>
    </Pressable>
  );
}

const TONES = {
  error: { fg: colors.danger, icon: "alert-circle" },
  success: { fg: "#248A3D", icon: "checkmark-circle" },
  info: { fg: colors.verified, icon: "information-circle" },
  warn: { fg: "#A05A00", icon: "shield-checkmark" },
} as const;

/** One-line status message: coloured glyph + text, no coloured box. */
export function Notice({ text, tone = "error", icon }: { text: string; tone?: keyof typeof TONES; icon?: IconName }) {
  const t = TONES[tone];
  return (
    <View accessibilityRole="alert" style={styles.notice}>
      <Ionicons name={icon ?? t.icon} size={18} color={t.fg} />
      <Text style={[styles.noticeText, tone === "error" && { color: colors.danger }]}>{text}</Text>
    </View>
  );
}

/** One line of copy led by an SF-style glyph. */
export function IconLine({ icon, color, children }: { icon: IconName; color: string; children: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
      <Ionicons name={icon} size={20} color={color} style={{ marginTop: 1 }} />
      <T style={{ flex: 1 }}>{children}</T>
    </View>
  );
}

/** iOS Contacts-style avatar: the photo, or initials on a soft grey gradient. */
export function Avatar({ uri, name, size }: { uri?: string | null; name?: string | null; size: number }) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={uri} style={[round, { backgroundColor: colors.line }]} contentFit="cover" />;
  const initials = (name ?? "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (
    <LinearGradient colors={["#A5ABB8", "#858994"]} style={[round, { alignItems: "center", justifyContent: "center" }]}>
      {initials ? (
        <Text style={{ color: colors.white, fontFamily: font.semibold, fontSize: size * 0.4, letterSpacing: 0.3 }}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={size * 0.55} color={colors.white} />
      )}
    </LinearGradient>
  );
}

/** Small handle at the top of bottom sheets. */
export function Grabber() {
  return <View style={styles.grabber} />;
}

const styles = StyleSheet.create({
  title: { fontFamily: font.black, fontSize: 32, lineHeight: 38, color: colors.ink, letterSpacing: -0.8 },
  h2: { fontFamily: font.bold, fontSize: 20, lineHeight: 25, color: colors.ink, letterSpacing: -0.3 },
  body: { fontFamily: font.regular, fontSize: 16, color: colors.ink, lineHeight: 22 },
  small: { fontFamily: font.regular, fontSize: 13.5, color: colors.muted, lineHeight: 19 },
  label: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  button: { height: 52, borderRadius: 14, justifyContent: "center" },
  buttonInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18 },
  buttonText: { fontFamily: font.semibold, fontSize: 16.5 },
  field: {
    backgroundColor: colors.card, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline,
    paddingHorizontal: 14, paddingVertical: 13, fontFamily: font.regular, fontSize: 16, color: colors.ink,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  checkLabel: { flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.ink, lineHeight: 21 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.fill },
  chipText: { fontFamily: font.medium, fontSize: 14.5, color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 10 },
  group: { backgroundColor: colors.card, borderRadius: 12, overflow: "hidden" },
  groupHeader: { fontFamily: font.medium, fontSize: 13, color: colors.muted, marginLeft: 16, marginBottom: 7 },
  groupFooter: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: colors.muted, marginHorizontal: 16, marginTop: 7 },
  row: { flexDirection: "row", alignItems: "center", paddingLeft: 16, minHeight: 48, backgroundColor: colors.card },
  tile: { width: 30, height: 30, borderRadius: 7, alignItems: "center", justifyContent: "center", marginRight: 14 },
  rowBody: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "stretch", paddingRight: 14, minHeight: 48 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  rowTitle: { flex: 1, fontFamily: font.regular, fontSize: 16, color: colors.ink },
  rowValue: { fontFamily: font.regular, fontSize: 15, color: colors.muted, maxWidth: "50%" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 4 },
  noticeText: { flex: 1, fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: colors.ink },
  grabber: { alignSelf: "center", width: 36, height: 5, borderRadius: 3, backgroundColor: colors.hairline, marginBottom: 6 },
});
