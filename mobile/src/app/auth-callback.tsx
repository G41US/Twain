import * as WebBrowser from "expo-web-browser";
import { Redirect } from "expo-router";

// Where Google sign-in returns to. On the web preview this closes the popup; in the app the
// sign-in screen already handled the code, so just move on.
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  return <Redirect href="/" />;
}
