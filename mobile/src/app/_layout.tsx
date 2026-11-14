import {
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, Screen, T } from "../components/ui";
import { isComplete, ProfileProvider, useProfile } from "../ctx/profile";
import { SessionProvider, useSession } from "../ctx/session";
import { colors } from "../lib/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
  });
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ProfileProvider>
          <Navigator fontsLoaded={fontsLoaded} />
        </ProfileProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function Navigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, loading } = useSession();
  const { me, loading: profileLoading, error, refresh } = useProfile();
  const ready = fontsLoaded && !loading && (!session || !profileLoading);

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  // Tapping a match/message notification opens that chat.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === "string" && (url.startsWith("/chat/") || url === "/profile")) router.push(url as never);
    });
    return () => sub.remove();
  }, []);

  if (!ready) return null;

  if (session && !me) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
          <T variant="h2">Couldn&apos;t load your profile</T>
          <T variant="small">{error || "Something went wrong."}</T>
          <Button title="Try again" onPress={refresh} />
        </View>
      </Screen>
    );
  }

  const done = isComplete(me);
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!session} redirectTo="/">
          <Stack.Screen name="welcome" />
          <Stack.Screen name="email" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="auth-callback" />
        </Stack.Protected>
        <Stack.Protected guard={!!session && !done} redirectTo="/">
          <Stack.Screen name="setup" />
        </Stack.Protected>
        <Stack.Protected guard={!!session && done} redirectTo="/">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" options={{ animation: "slide_from_right" }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
