import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

// Show match/message notifications even while the app is open.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
}

export type PushState = "granted" | "denied" | "undetermined" | "unavailable";

export async function pushPermission(): Promise<PushState> {
  if (Platform.OS === "web" || !Device.isDevice) return "unavailable";
  return (await Notifications.getPermissionsAsync()).status as PushState;
}

/**
 * Ask permission and register this phone for match/message notifications.
 * "unavailable" = this build has no push project configured yet (see mobile/README.md) or it's not a phone.
 */
export async function enablePush(): Promise<PushState> {
  if (Platform.OS === "web" || !Device.isDevice) return "unavailable";
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Matches & messages",
        importance: Notifications.AndroidImportance.HIGH, // eslint-disable-line import/namespace -- re-exported enum the plugin can't see
        vibrationPattern: [0, 200, 120, 200],
        lightColor: "#FF2D6F",
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return status as PushState;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return "unavailable";
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await api("/api/push", { body: { expoToken: token } });
    return "granted";
  } catch {
    return "unavailable";
  }
}
