import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, font, gradient } from "../lib/theme";

/** Page wrapper: keeps content clear of the status bar / notch / gesture bar. */
export function Screen({ children, edges = ["top"], style }: { children: ReactNode; edges?: Edge[]; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function T({ children, style, variant = "body", numberOfLines }: {
  children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number;
  variant?: "title" | "h2" | "body" | "small" | "label";
}) {
  return <Text numberOfLines={numberOfLines} style={[styles[variant], style]}>{children}</Text>;
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "light" | "outline" | "ghost" | "danger" | "clear";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = "primary", icon, loading, disabled, style }: ButtonProps) {
  const off = disabled || loading;
  const fg = variant === "primary" || variant === "danger" ? colors.white : variant === "light" ? colors.ink : variant === "outline" ? colors.ink : variant === "clear" ? colors.white : colors.brand;
  const inner = (
    <View style={styles.buttonInner}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && { backgroundColor: colors.brand },
        variant === "light" && { backgroundColor: colors.white },
        variant === "outline" && { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white },
        variant === "danger" && { backgroundColor: colors.danger },
        { opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      {inner}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label ? <T variant="label">{label}</T> : null}
      <TextInput placeholderTextColor="#A39AA8" {...rest} style={[styles.field, rest.multiline && { minHeight: 110, textAlignVertical: "top" }, style]} />
    </View>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.checkRow}
    >
      <View style={[styles.box, checked && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
        {checked ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
      </View>
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
              style={[styles.chip, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}
            >
              <Text style={[styles.chipText, on && { color: colors.white }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Card({ children, style, tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return <View style={[styles.card, tint ? { backgroundColor: tint, borderColor: "transparent" } : null, style]}>{children}</View>;
}

export function Notice({ text, tone = "error" }: { text: string; tone?: "error" | "info" | "success" }) {
  const bg = tone === "error" ? "#FDECEC" : tone === "success" ? "#E8F7EE" : "#EEF2FF";
  const fg = tone === "error" ? "#9B1C1C" : tone === "success" ? "#14532D" : "#1E3A8A";
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: bg, borderRadius: 14, padding: 12 }}>
      <Text style={{ color: fg, fontFamily: font.medium, fontSize: 14 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.black, fontSize: 30, color: colors.ink, letterSpacing: -0.5 },
  h2: { fontFamily: font.bold, fontSize: 18, color: colors.ink },
  body: { fontFamily: font.regular, fontSize: 15, color: colors.ink, lineHeight: 22 },
  small: { fontFamily: font.regular, fontSize: 13, color: colors.muted, lineHeight: 18 },
  label: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  button: { height: 56, borderRadius: 28, overflow: "hidden", justifyContent: "center" },
  buttonInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 20 },
  buttonText: { fontFamily: font.bold, fontSize: 16 },
  field: {
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14, fontFamily: font.regular, fontSize: 16, color: colors.ink,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: "#C9C0CE", alignItems: "center", justifyContent: "center" },
  checkLabel: { flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.ink, lineHeight: 21 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white },
  chipText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 10 },
});
