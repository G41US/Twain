import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
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
  const redirectTo = Linking.createURL("auth-callback"); // twain://auth-callback in the app
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
