import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

/** Is Google sign-in switched on in Supabase yet? */
export async function googleEnabled() {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } });
    return !!(await res.json())?.external?.google;
  } catch {
    return false;
  }
}

/**
 * Google sign-in through Supabase in the system browser (a real Chrome tab, so Google allows it).
 * Returns an error message, or "" on success / "cancel" if the person backed out.
 */
export async function signInWithGoogle(): Promise<string> {
  // App: twain://auth-callback. Web: the app lives under /app (experiments.baseUrl), which createURL leaves out.
  const redirectTo =
    Platform.OS === "web" ? `${window.location.origin}${process.env.EXPO_BASE_URL ?? ""}/auth-callback` : Linking.createURL("auth-callback");
  // Web: go to Google in this same tab and come back to /auth-callback. Pop-ups get blocked on phones,
  // and Google's pages cut the link back to the page that opened them, which left sign-in spinning.
  if (Platform.OS === "web") {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    return error?.message ?? "cancel"; // on success the page is already leaving
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) return error?.message ?? "Couldn't start Google sign-in.";

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return "cancel";

  const params = new URL(result.url).searchParams;
  const code = params.get("code");
  if (!code) return params.get("error_description") ?? "Google sign-in didn't finish.";
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return exchangeError?.message ?? "";
}
