import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import type { ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReportSheet } from "../../components/report-sheet";
import { Button, Screen, T } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { ask, tell } from "../../lib/dialog";
import { colors, font } from "../../lib/theme";

type Message = { id: string; senderId: string; body: string; createdAt: string };
type Other = { id: string; name: string | null; photos: string[]; image: string | null; verified: boolean };

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

  const wingman = async () => {
    setThinking(true);
    try {
      const data = await api<{ reply?: string; error?: string }>("/api/wingman", { body: { matchId: id } });
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
          <Button title="Back to matches" variant="outline" onPress={() => router.back()} style={{ alignSelf: "stretch" }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]} style={{ backgroundColor: colors.white }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </Pressable>
        {other ? <Image source={other.photos[0] || other.image} style={styles.avatar} /> : <View style={styles.avatar} />}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={styles.name} numberOfLines={1}>{other?.name ?? "…"}</Text>
          {other?.verified ? <Ionicons name="checkmark-circle" size={18} color={colors.verified} accessibilityLabel="Verified" /> : null}
        </View>
        <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="More options" hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={26} color={colors.ink} />
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
            <Text style={styles.safetyText}>🛡️ Never send money, airtime or bank details to anyone you meet here. Report anyone who asks.</Text>
          </View>
          {messages === null ? <ActivityIndicator color={colors.brand} /> : null}
          {messages?.length === 0 ? (
            <Text style={styles.hint}>You matched! Say hi 👋{"\n"}Stuck? Tap ✨ for an opener.</Text>
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
          <Pressable onPress={wingman} disabled={thinking} accessibilityRole="button" accessibilityLabel="AI wingman suggestion" style={styles.wingman}>
            {thinking ? <ActivityIndicator color={colors.violet} /> : <Text style={{ fontSize: 20 }}>✨</Text>}
          </Pressable>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message…"
            placeholderTextColor="#A39AA8"
            maxLength={1000}
            multiline
            accessibilityLabel="Message"
            style={styles.input}
          />
          <Pressable onPress={send} disabled={sending || !input.trim()} accessibilityRole="button" accessibilityLabel="Send"
            style={[styles.send, (sending || !input.trim()) && { opacity: 0.4 }]}>
            {sending ? <ActivityIndicator color={colors.white} /> : <Ionicons name="send" size={18} color={colors.white} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenu(false)}>
          <View style={[styles.menu, { top: insets.top + 56 }]}>
            <Pressable onPress={() => { setMenu(false); setReporting(true); }} style={styles.menuItem} accessibilityRole="button">
              <Ionicons name="flag-outline" size={20} color={colors.ink} /><Text style={styles.menuText}>Report</Text>
            </Pressable>
            <Pressable onPress={block} style={styles.menuItem} accessibilityRole="button">
              <Ionicons name="ban" size={20} color={colors.danger} /><Text style={[styles.menuText, { color: colors.danger }]}>Block & unmatch</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ReportSheet target={reporting && other ? other : null} onDone={() => setReporting(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEE8F1" },
  name: { fontFamily: font.bold, fontSize: 17, color: colors.ink, flexShrink: 1 },
  messages: { padding: 14, gap: 8, flexGrow: 1 },
  safety: { alignSelf: "center", maxWidth: 320, backgroundColor: "#FEF9C3", borderRadius: 14, padding: 10, marginBottom: 8 },
  safetyText: { fontFamily: font.medium, fontSize: 12.5, color: "#713F12", textAlign: "center", lineHeight: 17 },
  hint: { textAlign: "center", color: colors.muted, fontFamily: font.regular, fontSize: 15, marginTop: 24, lineHeight: 22 },
  bubble: { maxWidth: "80%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.brand, borderBottomRightRadius: 6 },
  theirs: { alignSelf: "flex-start", backgroundColor: "#F2EEF4", borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: font.regular, fontSize: 15.5, color: colors.ink, lineHeight: 21 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
  wingman: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F3E8FF", alignItems: "center", justifyContent: "center" },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 16,
    paddingTop: 11, paddingBottom: 11, fontFamily: font.regular, fontSize: 15.5, color: colors.ink,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  menuBackdrop: { flex: 1 },
  menu: { position: "absolute", right: 12, backgroundColor: colors.white, borderRadius: 16, paddingVertical: 6, minWidth: 210, elevation: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuText: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
});
