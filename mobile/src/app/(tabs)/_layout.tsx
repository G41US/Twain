import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font } from "../../lib/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: "#9A90A0",
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
        tabBarStyle: { borderTopColor: colors.line, backgroundColor: colors.white, height: 62 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6 },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: "Discover", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "flame" : "flame-outline"} color={color as string} size={size} /> }} />
      <Tabs.Screen name="matches" options={{ title: "Matches", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} color={color as string} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "person-circle" : "person-circle-outline"} color={color as string} size={size} /> }} />
    </Tabs>
  );
}
