import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

// Where Google sign-in returns to. Web: the page comes back here with a one-time code, which we swap
// for a session (the layout then moves on by itself). App: the sign-in screen already handled the code.
export default function AuthCallback() {
  const code = Platform.OS === "web" ? new URLSearchParams(window.location.search).get("code") : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (code) supabase.auth.exchangeCodeForSession(code).then(({ error }) => error && setFailed(true), () => setFailed(true));
  }, [code]);

  if (!code || failed) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.plum }}>
      <ActivityIndicator color={colors.white} size="large" accessibilityLabel="Signing you in" />
    </View>
  );
}
