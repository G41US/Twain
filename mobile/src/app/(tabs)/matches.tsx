import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Avatar, Screen, T } from "../../components/ui";
import { api } from "../../lib/api";
import { colors, font } from "../../lib/theme";

type MatchItem = {
  matchId: string;
  user: { id: string; name: string | null; photos: string[]; image: string | null; verified: boolean };
  lastMessage: string | null;
};

export default function Matches() {
  const [items, setItems] = useState<MatchItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api<MatchItem[]>("/api/matches"));
    } catch {
      setItems((old) => old ?? []);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <T variant="title" style={styles.title}>Matches</T>
      {items === null ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.matchId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />}
          contentContainerStyle={items.length === 0 ? { flex: 1 } : { paddingHorizontal: 16, paddingBottom: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={56} color="#D8C8E0" />
              <T variant="h2">No matches yet</T>
              <T variant="small" style={{ textAlign: "center" }}>When you and someone like each other, you&apos;ll find them here.</T>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/chat/${item.matchId}`)}
              accessibilityRole="button"
              accessibilityLabel={`Chat with ${item.user.name ?? "your match"}`}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
            >
              <Avatar uri={item.user.photos[0] || item.user.image} name={item.user.name} size={58} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.user.name ?? "Your match"}</Text>
                  {item.user.verified ? <Ionicons name="checkmark-circle" size={16} color={colors.verified} /> : null}
                </View>
                <Text style={[styles.last, !item.lastMessage && { color: colors.brand }]} numberOfLines={1}>
                  {item.lastMessage ?? "New match — say hi 👋"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C9C0CE" />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.white, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.line },
  name: { fontFamily: font.bold, fontSize: 16, color: colors.ink, flexShrink: 1 },
  last: { fontFamily: font.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
});
