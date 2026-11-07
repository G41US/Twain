import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { boundingBox, dealbreakersOk, distanceKm, genderFilter, vibeScore } from "@/lib/matching";

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
    where: {
      id: { not: me.id },
      banned: false,
      acceptedTermsAt: { not: null },
      photos: { isEmpty: false },
      ...genderFilter(me),
      ...boundingBox(lat, lng, me.maxDistanceKm),

      // Age range, both ways: they're in my range and I'm in theirs.
      age: { gte: me.ageMin, lte: me.ageMax },
      ageMin: { lte: myAge },
      ageMax: { gte: myAge },

      // Skip people I've liked or passed, and anyone blocked in either direction.
      likesReceived: { none: { likerId: me.id } },
      passesReceived: { none: { passerId: me.id } },
      blocksMade: { none: { blockedId: me.id } },
      blocksReceived: { none: { blockerId: me.id } },

      ...(me.preferEthnicity && me.preferEthnicity !== "all" && { ethnicity: me.preferEthnicity }),
    },
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
    .filter((c) => c.km <= me.maxDistanceKm && c.km <= c.maxDistanceKm && dealbreakersOk(me, c))
    .slice(0, 50)
    .map(({ vibeAnswers, latitude, longitude, traits, dealbreakers, maxDistanceKm, km, ...c }) => ({
      ...c,
      distanceKm: Math.max(1, Math.round(km)),
      vibe: vibeScore(me.vibeAnswers as Record<string, boolean>, vibeAnswers as Record<string, boolean>),
    }));

  return Response.json(candidates);
}
