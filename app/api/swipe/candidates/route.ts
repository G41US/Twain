import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { candidateWhere, distanceKm, fitsBothWays, vibeScore } from "@/lib/matching";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  if (!me.acceptedTermsAt || !me.gender || !me.lookingFor || !me.age || me.photos.length === 0 ||
      me.latitude === null || me.longitude === null) {
    return new Response("Complete your profile first", { status: 409 });
  }
  const myAge = me.age;
  const [lat, lng] = [me.latitude, me.longitude];

  const rows = await prisma.user.findMany({
    where: candidateWhere({ ...me, age: myAge, latitude: lat, longitude: lng }),
    select: {
      id: true, name: true, age: true, bio: true, photos: true, voiceIntroUrl: true, replyRate: true,
      verified: true, vibeAnswers: true, traits: true, dealbreakers: true, latitude: true, longitude: true,
      maxDistanceKm: true,
    },
    orderBy: { lastActiveAt: { sort: "desc", nulls: "last" } },
    take: 200,
  });

  // shortcut: filters up to 200 nearby rows in memory; move distance into SQL (PostGIS) past ~10k users.
  const candidates = rows
    .map((c) => ({ ...c, km: distanceKm(lat, lng, c.latitude!, c.longitude!) }))
    .filter((c) => fitsBothWays(me, c, c.km))
    .slice(0, 50)
    .map(({ vibeAnswers, latitude, longitude, traits, dealbreakers, maxDistanceKm, km, ...c }) => ({
      ...c,
      distanceKm: Math.max(1, Math.round(km)),
      vibe: vibeScore(me.vibeAnswers as Record<string, boolean>, vibeAnswers as Record<string, boolean>),
    }));

  return Response.json(candidates);
}
