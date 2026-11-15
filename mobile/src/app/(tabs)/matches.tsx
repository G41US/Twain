import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Avatar, Screen, T } from "../../components/ui";
import { useWide } from "../../components/web-frame";
import { Chat } from "../chat/[id]";
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
  const wide = useWide();
  const { c: openId } = useLocalSearchParams<{ c?: string }>(); // computers: the chat open beside the list

  const load = useCallback(async () => {
    try {
      setItems(await api<MatchItem[]>("/api/matches"));
    } catch {
      setItems((old) => old ?? []);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const list = (
    <>
      <T variant="title" style={styles.title}>Matches</T>
      {items === null ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.matchId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />}
          contentContainerStyle={items.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={52} color={colors.hairline} />
              <T variant="h2">No matches yet</T>
              <T variant="small" style={{ textAlign: "center" }}>When you and someone like each other, you&apos;ll find them here.</T>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => (wide ? router.setParams({ c: item.matchId }) : router.push(`/chat/${item.matchId}`))}
              accessibilityRole="button"
              accessibilityLabel={`Chat with ${item.user.name ?? "your match"}`}
              style={({ pressed }) => [styles.row, (pressed || (wide && item.matchId === openId)) && { backgroundColor: colors.bg }]}
            >
              <Avatar uri={item.user.photos[0] || item.user.image} name={item.user.name} size={54} />
              <View style={styles.rowBody}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.user.name ?? "Your match"}</Text>
                  {item.user.verified ? <Ionicons name="checkmark-circle" size={16} color={colors.verified} /> : null}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {!item.lastMessage ? <View style={styles.newDot} /> : null}
                  <Text style={[styles.last, !item.lastMessage && { color: colors.ink, fontFamily: font.medium }]} numberOfLines={2}>
                    {item.lastMessage ?? "New match. Say hi 👋"}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </>
  );

  if (!wide) return <Screen style={{ backgroundColor: colors.white }}>{list}</Screen>;
  return (
    <Screen max={1180}>
      <View style={styles.split}>
        <View style={styles.listPane}>{list}</View>
        <View style={{ flex: 1 }}>
          {openId ? (
            <Chat key={openId} id={openId} onClose={() => { router.setParams({ c: "" }); load(); }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={52} color={colors.hairline} />
              <T variant="small">{items?.length ? "Pick a conversation." : "Your chats will show here."}</T>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  split: { flex: 1, flexDirection: "row", backgroundColor: colors.white, borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  listPane: { width: 340, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.hairline },
  title: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 16 },
  rowBody: { flex: 1, minWidth: 0, paddingVertical: 14, paddingRight: 16, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  name: { fontFamily: font.semibold, fontSize: 16.5, color: colors.ink, flexShrink: 1 },
  last: { flexShrink: 1, fontFamily: font.regular, fontSize: 14.5, lineHeight: 19, color: colors.muted },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
});
