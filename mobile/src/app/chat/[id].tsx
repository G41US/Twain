import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import type { ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DateSafetySheet } from "../../components/date-safety-sheet";
import { ReportSheet } from "../../components/report-sheet";
import { Avatar, Button, Screen, T } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { ask, tell } from "../../lib/dialog";
import { WINGMAN_STYLES } from "../../lib/options";
import { colors, font } from "../../lib/theme";

type Message = { id: string; senderId: string; body: string; createdAt: string };
type Other = { id: string; name: string | null; photos: string[]; image: string | null; verified: boolean };

const STYLE_HINTS = { natural: "Relaxed and warm", witty: "Playful", direct: "Says what you mean", romantic: "Sweet, not cheesy" } as const;

// shortcut: polls every 3s; switch to Supabase Realtime if chats get busy.
const POLL_MS = 3000;

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [me, setMe] = useState("");
  const [other, setOther] = useState<Other | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [gone, setGone] = useState(false);
  const [stylePicker, setStylePicker] = useState(false);
  const [dateTips, setDateTips] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ me: string; other: Other; messages: Message[] }>(`/api/chat/${id}`);
      setMe(data.me);
      setOther(data.other);
      setMessages((old) => (old && old.length === data.messages.length ? old : data.messages));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setGone(true);
    }
  }, [id]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, POLL_MS);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [load]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await api(`/api/chat/${id}`, { body: { body } });
      setInput("");
      await load();
    } catch (e) {
      tell("Message not sent", e instanceof ApiError && e.status === 429 ? "You're sending messages too fast." : "Check your connection and try again.");
    }
    setSending(false);
  };

  const wingman = async (style: (typeof WINGMAN_STYLES)[number]) => {
    setStylePicker(false);
    setThinking(true);
    try {
      const data = await api<{ reply?: string; error?: string }>("/api/wingman", { body: { matchId: id, style } });
      if (data.reply) setInput(data.reply);
    } catch (e) {
      tell("Wingman is resting", e instanceof ApiError && e.status === 503 ? "The AI wingman isn't switched on yet." : "Try again in a moment.");
    }
    setThinking(false);
  };

  const block = async () => {
    setMenu(false);
    if (!other || !(await ask(`Block ${other.name ?? "this person"}?`, "You'll unmatch and they won't see you again.", "Block", true))) return;
    try {
      await api("/api/block", { body: { targetId: other.id } });
      router.back();
    } catch {
      tell("Couldn't block", "Check your connection and try again.");
    }
  };

  if (gone) {
    return (
      <Screen>
        <View style={styles.center}>
          <T variant="h2">This chat is no longer available</T>
          <Button title="Back to matches" variant="secondary" onPress={() => router.back()} style={{ alignSelf: "stretch" }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]} style={{ backgroundColor: colors.white }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} style={styles.navSide}>
          <Ionicons name="chevron-back" size={30} color={colors.brand} />
        </Pressable>
        <View style={styles.who}>
          <Avatar uri={other?.photos[0] || other?.image} name={other?.name} size={38} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Text style={styles.name} numberOfLines={1}>{other?.name ?? " "}</Text>
            {other?.verified ? <Ionicons name="checkmark-circle" size={13} color={colors.verified} accessibilityLabel="Verified" /> : null}
          </View>
        </View>
        <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="More options" hitSlop={10} style={[styles.navSide, { alignItems: "flex-end" }]}>
          <Ionicons name="ellipsis-horizontal-circle-outline" size={28} color={colors.brand} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={insets.top + 60}>
        <ScrollView
          ref={scroll}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.safety}>
            <Ionicons name="shield-checkmark" size={13} color={colors.muted} />
            <Text style={styles.safetyText}>Never send money, airtime or bank details to anyone you meet here. Report anyone who asks.</Text>
          </View>
          {messages === null ? <ActivityIndicator color={colors.brand} /> : null}
          {messages?.length === 0 ? (
            <Text style={styles.hint}>You matched! Say hi 👋{"\n"}Stuck? Tap the sparkles for an opener.</Text>
          ) : null}
          {messages?.map((m) => {
            const mine = m.senderId === me;
            return (
              <View key={m.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.bubbleText, mine && { color: colors.white }]}>{m.body}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable onPress={() => setStylePicker(true)} disabled={thinking} accessibilityRole="button" accessibilityLabel="Suggest a message" style={styles.wingman}>
            {thinking ? <ActivityIndicator color={colors.violet} /> : <Ionicons name="sparkles" size={21} color={colors.violet} />}
          </Pressable>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message…"
            placeholderTextColor={colors.faint}
            maxLength={1000}
            multiline
            accessibilityLabel="Message"
            style={styles.input}
          />
          <Pressable onPress={send} disabled={sending || !input.trim()} accessibilityRole="button" accessibilityLabel="Send"
            style={[styles.send, (sending || !input.trim()) && { backgroundColor: colors.faint }]}>
            {sending ? <ActivityIndicator color={colors.white} /> : <Ionicons name="arrow-up" size={20} color={colors.white} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenu(false)}>
          <View style={[styles.menu, { top: insets.top + 56 }]}>
            <Pressable onPress={() => { setMenu(false); setDateTips(true); }} accessibilityRole="button"
              style={({ pressed }) => [styles.menuItem, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline }, pressed && { backgroundColor: colors.bg }]}>
              <Text style={styles.menuText}>Planning to meet?</Text><Ionicons name="calendar-outline" size={19} color={colors.ink} />
            </Pressable>
            <Pressable onPress={() => { setMenu(false); setReporting(true); }} accessibilityRole="button"
              style={({ pressed }) => [styles.menuItem, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline }, pressed && { backgroundColor: colors.bg }]}>
              <Text style={styles.menuText}>Report</Text><Ionicons name="flag-outline" size={19} color={colors.ink} />
            </Pressable>
            <Pressable onPress={block} accessibilityRole="button" style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.bg }]}>
              <Text style={[styles.menuText, { color: colors.danger }]}>Block and unmatch</Text><Ionicons name="hand-left-outline" size={19} color={colors.danger} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={stylePicker} transparent animationType="fade" onRequestClose={() => setStylePicker(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setStylePicker(false)}>
          <View style={[styles.menu, { top: undefined, right: undefined, left: 10, bottom: insets.bottom + 60 }]}>
            <Text style={styles.menuHeader}>Suggest a message that&apos;s…</Text>
            {WINGMAN_STYLES.map((st, i) => (
              <Pressable key={st} onPress={() => wingman(st)} accessibilityRole="button"
                style={({ pressed }) => [styles.menuItem, i < WINGMAN_STYLES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline }, pressed && { backgroundColor: colors.bg }]}>
                <Text style={styles.menuText}>{st[0].toUpperCase() + st.slice(1)}</Text>
                <Text style={styles.menuHint}>{STYLE_HINTS[st]}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <DateSafetySheet name={other?.name ?? "them"} visible={dateTips} onClose={() => setDateTips(false)} />
      <ReportSheet target={reporting && other ? other : null} onDone={() => setReporting(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingTop: 4, paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline, backgroundColor: "#F9F9F9",
  },
  navSide: { width: 56, justifyContent: "center" },
  who: { flex: 1, alignItems: "center", gap: 3 },
  name: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink, flexShrink: 1 },
  messages: { paddingHorizontal: 12, paddingVertical: 14, gap: 4, flexGrow: 1 },
  safety: { alignSelf: "center", maxWidth: 300, flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 14, marginTop: 2 },
  safetyText: { flex: 1, fontFamily: font.regular, fontSize: 12, color: colors.muted, lineHeight: 16, textAlign: "center" },
  hint: { textAlign: "center", color: colors.muted, fontFamily: font.regular, fontSize: 15, marginTop: 24, lineHeight: 22 },
  bubble: { maxWidth: "78%", borderRadius: 19, paddingHorizontal: 13, paddingVertical: 8, marginVertical: 1 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.brand, borderBottomRightRadius: 5 },
  theirs: { alignSelf: "flex-start", backgroundColor: "#E9E9EB", borderBottomLeftRadius: 5 },
  bubbleText: { fontFamily: font.regular, fontSize: 16, color: colors.ink, lineHeight: 21 },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 10, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline, backgroundColor: "#F9F9F9",
  },
  wingman: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.fill, alignItems: "center", justifyContent: "center" },
  input: {
    flex: 1, minHeight: 38, maxHeight: 120, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline,
    backgroundColor: colors.white, paddingHorizontal: 14, paddingTop: 9, paddingBottom: 9, fontFamily: font.regular, fontSize: 16, color: colors.ink,
  },
  send: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  menuBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.08)" },
  menu: {
    position: "absolute", right: 12, backgroundColor: colors.white, borderRadius: 14, minWidth: 220, overflow: "hidden",
    elevation: 8, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
  },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  menuText: { fontFamily: font.regular, fontSize: 16, color: colors.ink },
  menuHint: { fontFamily: font.regular, fontSize: 13.5, color: colors.muted },
  menuHeader: { fontFamily: font.medium, fontSize: 12.5, color: colors.muted, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
});
