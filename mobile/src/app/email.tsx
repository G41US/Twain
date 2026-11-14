import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import type { TextInputInstance } from "react-native";
import { Button, Field, Notice, Screen, T } from "../components/ui";
import { supabase } from "../lib/supabase";
import { colors, font } from "../lib/theme";

const RESEND_SECONDS = 60;
const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

// Turn Supabase's messages into something a person can act on.
function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return "Too many tries. Wait a minute, then try again.";
  if (m.includes("expired") || m.includes("invalid")) return "That code is wrong or has expired. Check the latest email, or send a new code.";
  return message;
}

export default function EmailSignIn() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  const codeInput = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const sendCode = async () => {
    const addr = email.trim().toLowerCase();
    if (!looksLikeEmail(addr)) return setError("Enter a valid email address.");
    setBusy(true);
    setError("");
    const { error: e } = await supabase.auth.signInWithOtp({ email: addr, options: { shouldCreateUser: true } });
    setBusy(false);
    if (e) return setError(friendly(e.message));
    setEmail(addr);
    setStep("code");
    setWait(RESEND_SECONDS);
    setTimeout(() => codeInput.current?.focus(), 300);
  };

  const verify = async (value = code) => {
    if (!/^\d{6,10}$/.test(value)) return setError("Enter the code from your email.");
    setBusy(true);
    setError("");
    const { error: e } = await supabase.auth.verifyOtp({ email, token: value, type: "email" });
    setBusy(false);
    // On success the session changes and navigation moves on by itself.
    if (e) setError(friendly(e.message));
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.wrap}>
          <Pressable
            onPress={() => (step === "code" ? (setStep("email"), setCode(""), setError("")) : router.back())}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>

          {step === "email" ? (
            <View style={styles.body}>
              <T variant="title">What&apos;s your email?</T>
              <T variant="small">We&apos;ll send you a 6-digit code to sign in. No password needed.</T>
              <Field
                value={email}
                onChangeText={(v) => { setEmail(v); setError(""); }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoFocus
                returnKeyType="send"
                onSubmitEditing={sendCode}
                accessibilityLabel="Email address"
              />
              {error ? <Notice text={error} /> : null}
              <Button title="Send code" onPress={sendCode} loading={busy} disabled={!email.trim()} />
            </View>
          ) : (
            <View style={styles.body}>
              <T variant="title">Enter your code</T>
              <T variant="small">We sent it to {email}. It can take a minute — check spam too.</T>
              <TextInput
                ref={codeInput}
                value={code}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, "").slice(0, 10);
                  setCode(digits);
                  setError("");
                  if (digits.length === 6) verify(digits);
                }}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={10}
                placeholder="••••••"
                placeholderTextColor="#C9C0CE"
                accessibilityLabel="6-digit code"
                style={styles.code}
              />
              {error ? <Notice text={error} /> : null}
              <Button title="Verify" onPress={() => verify()} loading={busy} disabled={code.length < 6} />
              <Button
                title={wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
                variant="ghost"
                onPress={sendCode}
                disabled={wait > 0 || busy}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24 },
  back: { width: 44, height: 44, justifyContent: "center", marginLeft: -8 },
  body: { gap: 16, marginTop: 12 },
  code: {
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, borderRadius: 18,
    paddingVertical: 16, textAlign: "center", fontFamily: font.bold, fontSize: 32, letterSpacing: 12, color: colors.ink,
  },
});
