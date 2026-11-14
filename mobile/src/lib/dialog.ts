import { Alert, Platform } from "react-native";

/** Simple message box (Alert doesn't show on the web preview). */
export function tell(title: string, message = "") {
  if (Platform.OS === "web") window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

/** Yes/no question. Resolves true if the person confirms. */
export function ask(title: string, message: string, confirmText = "OK", destructive = false): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: confirmText, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}

/** Free-text question (used for report reasons). Resolves null if cancelled. */
export function prompt(title: string, message: string): Promise<string | null> {
  if (Platform.OS === "web") return Promise.resolve(window.prompt(`${title}\n\n${message}`));
  if (Platform.OS === "ios") {
    return new Promise((resolve) =>
      Alert.prompt(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
        { text: "Send", onPress: (v?: string) => resolve(v ?? null) },
      ]),
    );
  }
  return Promise.resolve(null); // Android has no text prompt: callers show their own reason picker
}
