import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pattern } from "../../components/ui";
import { useWide } from "../../components/web-frame";
import { colors, font } from "../../lib/theme";

// Computers: a sidebar with the logo on the left. Phones: the iOS tab bar at the bottom.
function Sidebar() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.sidebar]}>
      <Pattern />
      <Text style={styles.logo}>Twain<Text style={{ color: colors.brand }}>.</Text></Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const wide = useWide();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: wide ? colors.white : colors.brand,
        tabBarInactiveTintColor: wide ? "rgba(255,255,255,0.6)" : colors.muted,
        ...(wide
          ? {
              tabBarPosition: "left",
              tabBarVariant: "material",
              tabBarLabelPosition: "beside-icon",
              tabBarActiveBackgroundColor: colors.brand,
              tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 15 },
              tabBarBackground: Sidebar,
              tabBarStyle: { width: 240, minWidth: 240, paddingTop: 84, paddingHorizontal: 12, borderRightWidth: 0 },
              tabBarItemStyle: { borderRadius: 14, marginVertical: 3 },
            }
          : {
              tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11, lineHeight: 14 },
              tabBarStyle: { borderTopColor: colors.hairline, borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: colors.bar, height: 62 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6 },
            }),
      }}
    >
      <Tabs.Screen name="discover" options={{ title: "Discover", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "flame" : "flame-outline"} color={color as string} size={size} /> }} />
      <Tabs.Screen name="matches" options={{ title: "Matches", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} color={color as string} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "person-circle" : "person-circle-outline"} color={color as string} size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  sidebar: { backgroundColor: colors.plum, overflow: "hidden" },
  logo: { fontFamily: font.black, fontSize: 30, color: colors.white, letterSpacing: -1.2, paddingHorizontal: 24, paddingTop: 28 },
});
