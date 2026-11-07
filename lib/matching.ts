// Pure matching helpers — no imports, so they're easy to test (see matching.test.ts).

type Answers = Record<string, boolean> | null | undefined;

/** Prisma `where` clause: candidates I want to see AND who want to see someone like me. */
export function genderFilter(me: { gender: string | null; lookingFor: string | null }) {
  const want = me.lookingFor === "Men" ? "Male" : me.lookingFor === "Women" ? "Female" : null;
  const acceptsMe =
    me.gender === "Male" ? ["Men", "Everyone"] : me.gender === "Female" ? ["Women", "Everyone"] : ["Everyone"];
  return { ...(want && { gender: want }), lookingFor: { in: acceptsMe } };
}

/** % of vibe questions both people answered the same way, or null if nothing to compare. */
export function vibeScore(a: Answers, b: Answers): number | null {
  if (!a || !b) return null;
  const shared = Object.keys(a).filter((k) => k in b);
  if (shared.length === 0) return null;
  const same = shared.filter((k) => a[k] === b[k]).length;
  return Math.round((100 * same) / shared.length);
}

/**
 * Reply rate: of conversations where someone else messaged this user,
 * the % where this user replied after that first message. Null if nobody has messaged them.
 * Each conversation is its sender ids in time order.
 */
export function calcReplyRate(userId: string, conversations: string[][]): number | null {
  let received = 0;
  let replied = 0;
  for (const senders of conversations) {
    const firstFromOther = senders.findIndex((s) => s !== userId);
    if (firstFromOther === -1) continue;
    received++;
    if (senders.slice(firstFromOther + 1).includes(userId)) replied++;
  }
  return received === 0 ? null : Math.round((100 * replied) / received);
}

/** Great-circle distance in km. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Lat/lng range that contains every point within `km` (cheap pre-filter before distanceKm). */
export function boundingBox(lat: number, lng: number, km: number) {
  const dLat = km / 111;
  const dLng = km / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return { latitude: { gte: lat - dLat, lte: lat + dLat }, longitude: { gte: lng - dLng, lte: lng + dLng } };
}

/** Round to 2 decimals (~1 km) so exact home locations are never stored. */
export const roundCoord = (n: number) => Math.round(n * 100) / 100;

/** True if neither person has a trait the other listed as a dealbreaker. */
export function dealbreakersOk(
  a: { traits: string[]; dealbreakers: string[] },
  b: { traits: string[]; dealbreakers: string[] },
): boolean {
  return !a.dealbreakers.some((d) => b.traits.includes(d)) && !b.dealbreakers.some((d) => a.traits.includes(d));
}
