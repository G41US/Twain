import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Animated, Modal, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { VoicePlayer } from "../../components/profile-form";
import { ReportSheet } from "../../components/report-sheet";
import { Button, Screen, T } from "../../components/ui";
import { useProfile } from "../../ctx/profile";
import { api, ApiError } from "../../lib/api";
import { tell } from "../../lib/dialog";
import { colors, font } from "../../lib/theme";

type Person = {
  id: string; name: string | null; age: number | null; bio: string | null; photos: string[];
  voiceIntroUrl: string | null; replyRate: number | null; vibe: number | null; verified: boolean; distanceKm: number;
};

const SWIPE_OUT = 120; // px of drag that counts as a swipe

export default function Discover() {
  const { me } = useProfile();
  const { width } = useWindowDimensions();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState("");
  const [match, setMatch] = useState<{ matchId: string; person: Person } | null>(null);
  const [reporting, setReporting] = useState<Person | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [pos] = useState(() => new Animated.ValueXY());
  const busy = useRef(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setPeople(await api<Person[]>("/api/swipe/candidates"));
    } catch {
      setError("Can't load people right now. Check your connection.");
      setPeople([]);
    }
  }, []);

  // Reload when you come back to this tab (e.g. after changing your distance in Profile).
  useFocusEffect(useCallback(() => { if (people === null || people.length === 0) load(); }, [load, people]));

  const top = people?.[0];

  const next = () => {
    pos.setValue({ x: 0, y: 0 });
    setPhotoIndex(0);
    setPeople((p) => (p ? p.slice(1) : p));
    busy.current = false;
  };

  const swipe = async (dir: "left" | "right") => {
    if (!top || busy.current) return;
    busy.current = true;
    const person = top;
    Animated.timing(pos, { toValue: { x: (dir === "right" ? 1.5 : -1.5) * width, y: 40 }, duration: 220, useNativeDriver: false }).start(next);
    try {
      if (dir === "left") {
        await api("/api/swipe/left", { body: { targetId: person.id } });
      } else {
        const res = await api<{ matchId: string | null }>("/api/swipe/right", { body: { targetId: person.id } });
        if (res.matchId) setMatch({ matchId: res.matchId, person });
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) tell("Take a breather", "You've liked a lot of people this hour. Come back a little later.");
    }
  };

  // eslint-disable-next-line react-hooks/refs -- refs are only read inside the gesture callbacks, not during render
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => pos.setValue({ x: g.dx, y: g.dy * 0.3 }),
    onPanResponderRelease: (e, g) => {
      if (g.dx > SWIPE_OUT) return swipe("right");
      if (g.dx < -SWIPE_OUT) return swipe("left");
      // A tap (barely moved): left/right side of the card flips through photos.
      if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6 && top && top.photos.length > 1) {
        const x = e.nativeEvent.locationX;
        setPhotoIndex((i) => (x < width / 2 ? Math.max(0, i - 1) : Math.min(top.photos.length - 1, i + 1)));
      }
      Animated.spring(pos, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
    },
  });

  if (people === null) {
    return <Screen><View style={styles.center}><ActivityIndicator color={colors.brand} size="large" /></View></Screen>;
  }

  const rotate = pos.x.interpolate({ inputRange: [-width, 0, width], outputRange: ["-12deg", "0deg", "12deg"] });
  const likeOpacity = pos.x.interpolate({ inputRange: [20, 120], outputRange: [0, 1], extrapolate: "clamp" });
  const nopeOpacity = pos.x.interpolate({ inputRange: [-120, -20], outputRange: [1, 0], extrapolate: "clamp" });
  const nextScale = pos.x.interpolate({ inputRange: [-width, 0, width], outputRange: [1, 0.94, 1], extrapolate: "clamp" });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.logo}>Twain<Text style={{ color: colors.brand }}>.</Text></Text>
        <Pressable onPress={() => router.push("/profile")} accessibilityRole="button" accessibilityLabel="Edit preferences" hitSlop={10}>
          <Ionicons name="options-outline" size={26} color={colors.ink} />
        </Pressable>
      </View>

      {!top ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={52} color={colors.hairline} />
          <T variant="h2" style={{ textAlign: "center" }}>{error ? "Couldn't load" : "No one new nearby right now"}</T>
          <T variant="small" style={{ textAlign: "center" }}>
            {error || `Try a bigger distance (now ${me?.maxDistanceKm ?? 50} km) or age range, or check back later.`}
          </T>
          <Button title="Refresh" icon="refresh" variant="secondary" onPress={() => { setPeople(null); load(); }} style={{ alignSelf: "stretch" }} />
        </View>
      ) : (
        <>
          <View style={styles.deck}>
            {people[1] ? (
              <Animated.View style={[styles.card, { transform: [{ scale: nextScale }] }]}>
                <Image source={people[1].photos[0]} style={StyleSheet.absoluteFill} contentFit="cover" />
              </Animated.View>
            ) : null}
            <Animated.View
              {...responder.panHandlers}
              style={[styles.card, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}
            >
              <Image source={top.photos[photoIndex] ?? top.photos[0]} style={StyleSheet.absoluteFill} contentFit="cover" transition={150}
                accessibilityLabel={`${top.name ?? "Profile"} photo`} />
              {top.photos.length > 1 ? (
                <View style={styles.dots}>
                  {top.photos.map((p, i) => <View key={p} style={[styles.dot, i === photoIndex && { backgroundColor: colors.white }]} />)}
                </View>
              ) : null}
              <Animated.View style={[styles.stamp, styles.like, { opacity: likeOpacity }]}>
                <Ionicons name="heart" size={22} color={colors.white} /><Text style={styles.stampText}>Like</Text>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.nope, { opacity: nopeOpacity }]}>
                <Ionicons name="close" size={22} color={colors.white} /><Text style={styles.stampText}>Pass</Text>
              </Animated.View>

              <Pressable onPress={() => setReporting(top)} style={styles.flag} accessibilityRole="button" accessibilityLabel="Report profile" hitSlop={8}>
                <Ionicons name="flag-outline" size={17} color={colors.white} />
              </Pressable>

              <LinearGradient colors={["transparent", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.85)"]} style={styles.info}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.name} numberOfLines={1}>{top.name ?? "Someone"}, {top.age ?? "?"}</Text>
                  {top.verified ? <Ionicons name="checkmark-circle" size={22} color={colors.white} accessibilityLabel="Verified" /> : null}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Ionicons name="location" size={14} color="rgba(255,255,255,0.85)" /><Text style={styles.meta}>{top.distanceKm} km away</Text></View>
                <View style={styles.tags}>
                  {top.vibe !== null ? <Tag icon="sparkles" text={`${top.vibe}% vibe match`} /> : null}
                  <Tag icon="chatbubble-ellipses" text={top.replyRate === null ? "New here" : `Replies ${Math.round(top.replyRate)}%`} />
                </View>
                {top.bio ? <Text style={styles.bio} numberOfLines={3}>{top.bio}</Text> : null}
                {top.voiceIntroUrl ? <VoicePlayer key={top.id} url={top.voiceIntroUrl} light /> : null}
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={styles.actions}>
            <RoundButton icon="close" label="Pass" onPress={() => swipe("left")} />
            <RoundButton icon="heart" label="Like" onPress={() => swipe("right")} primary />
          </View>
        </>
      )}

      <ReportSheet target={reporting} onDone={(sent) => { setReporting(null); if (sent) next(); }} />

      <Modal visible={!!match} transparent animationType="fade" onRequestClose={() => setMatch(null)}>
        <View style={styles.matchWrap}>
          <Text style={styles.matchTitle}>It&apos;s a match</Text>
          <Text style={styles.matchSub}>You and {match?.person.name ?? "they"} like each other.</Text>
          <View style={styles.matchPhotos}>
            {me?.photos[0] ? <Image source={me.photos[0]} style={[styles.matchPhoto, { transform: [{ rotate: "-8deg" }] }]} /> : null}
            {match?.person.photos[0] ? <Image source={match.person.photos[0]} style={[styles.matchPhoto, { transform: [{ rotate: "8deg" }], marginLeft: -24 }]} /> : null}
          </View>
          <Button title="Send a message" icon="chatbubble"
            onPress={() => { const id = match!.matchId; setMatch(null); router.push(`/chat/${id}`); }} style={{ alignSelf: "stretch" }} />
          <Button title="Keep swiping" variant="clear" onPress={() => setMatch(null)} style={{ alignSelf: "stretch" }} />
        </View>
      </Modal>
    </Screen>
  );
}

function Tag({ text, icon }: { text: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.tag}>
      {icon ? <Ionicons name={icon} size={13} color={colors.white} /> : null}
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

function RoundButton({ icon, label, onPress, primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; primary?: boolean }) {
  const size = primary ? 68 : 60;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [styles.round, primary && { backgroundColor: colors.brand }, { width: size, height: size, borderRadius: size / 2, transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
      <Ionicons name={icon} size={primary ? 32 : 28} color={primary ? colors.white : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8 },
  logo: { fontFamily: font.black, fontSize: 30, color: colors.ink, letterSpacing: -1.2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  deck: { flex: 1, marginHorizontal: 12, marginTop: 4 },
  card: { ...StyleSheet.absoluteFill, borderRadius: 24, overflow: "hidden", backgroundColor: "#1C1C1E" },
  dots: { position: "absolute", top: 10, left: 12, right: 12, flexDirection: "row", gap: 4 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" },
  stamp: { position: "absolute", top: 40, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 9 },
  like: { left: 18, backgroundColor: colors.brand },
  nope: { right: 18, backgroundColor: "rgba(28,28,30,0.85)" },
  stampText: { fontFamily: font.bold, fontSize: 18, color: colors.white },
  flag: { position: "absolute", top: 24, right: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.32)", alignItems: "center", justifyContent: "center" },
  info: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 80, paddingBottom: 20, gap: 8 },
  name: { color: colors.white, fontFamily: font.bold, fontSize: 30, letterSpacing: -0.6, flexShrink: 1 },
  meta: { color: "rgba(255,255,255,0.85)", fontFamily: font.medium, fontSize: 14 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(255,255,255,0.2)" },
  tagText: { color: colors.white, fontFamily: font.semibold, fontSize: 12.5 },
  bio: { color: "rgba(255,255,255,0.92)", fontFamily: font.regular, fontSize: 15, lineHeight: 21 },
  actions: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 36, paddingVertical: 14 },
  round: { backgroundColor: colors.white, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  matchWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 12, backgroundColor: colors.plum },
  matchTitle: { color: colors.white, fontFamily: font.black, fontSize: 40, letterSpacing: -1.2, textAlign: "center" },
  matchSub: { color: "rgba(255,255,255,0.7)", fontFamily: font.regular, fontSize: 16, textAlign: "center" },
  matchPhotos: { flexDirection: "row", marginVertical: 28 },
  matchPhoto: { width: 136, height: 180, borderRadius: 20, borderWidth: 3, borderColor: colors.white, backgroundColor: "#2C2C2E" },
});
