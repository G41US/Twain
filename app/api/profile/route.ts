import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUCKET, SUPABASE_URL } from "@/lib/supabase";
import { DISTANCES, TRAIT_VALUES, VIBE_QUESTIONS } from "@/lib/options";
import { roundCoord } from "@/lib/matching";
import { z } from "zod";

const OUR_MEDIA = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
// Files we host that this user uploaded (paths are "<kind>/<userId>/<uuid>.<ext>"), or ones already on their profile.
const ownMedia = (me: { id: string; photos: string[]; voiceIntroUrl: string | null }) =>
  z.string().url().refine((u) =>
    u.startsWith(`${OUR_MEDIA}photo/${me.id}/`) || u.startsWith(`${OUR_MEDIA}voice/${me.id}/`) ||
    me.photos.includes(u) || u === me.voiceIntroUrl);
const trait = z.enum(TRAIT_VALUES as [string, ...string[]]);

// Only these fields can be set by the user; anything else (isAdmin, verified, replyRate...) is rejected.
const profileInput = (me: Parameters<typeof ownMedia>[0]) =>
  z
    .object({
      bio: z.string().trim().max(500),
      age: z.number().int().min(18).max(100),
      gender: z.enum(["Male", "Female", "Non-binary", "Other"]),
      lookingFor: z.enum(["Men", "Women", "Everyone"]),
      ethnicity: z.string().max(50).nullable(),
      preferEthnicity: z.string().max(50),
      sensitiveConsent: z.boolean(),
      photos: z.array(ownMedia(me)).max(6),
      voiceIntroUrl: z.union([ownMedia(me), z.literal("")]),
      vibeAnswers: z.record(z.enum(VIBE_QUESTIONS), z.boolean()),
      traits: z.array(trait).max(10),
      dealbreakers: z.array(trait).max(10),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      maxDistanceKm: z.number().refine((n) => (DISTANCES as readonly number[]).includes(n)),
      ageMin: z.number().int().min(18).max(100),
      ageMax: z.number().int().min(18).max(100),
      acceptTerms: z.literal(true),
    })
    .partial()
    .strict();

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const { banned, lastActiveAt, emailVerified, selfieUrl, ...profile } = me;
  return Response.json(profile);
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const parsed = profileInput(me).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json(parsed.error.flatten(), { status: 400 });
  const { acceptTerms, sensitiveConsent, latitude, longitude, ...data } = parsed.data;

  const ageMin = data.ageMin ?? me.ageMin, ageMax = data.ageMax ?? me.ageMax;
  if (ageMin > ageMax) return new Response("Age range is backwards", { status: 400 });

  // Ethnicity is sensitive personal data under Nigeria's NDPA: only store it with explicit consent.
  if (data.ethnicity && !sensitiveConsent && !me.sensitiveConsentAt) {
    return new Response("Tick the consent box to save your ethnicity", { status: 400 });
  }

  const removed = data.photos ? me.photos.filter((p) => !data.photos!.includes(p)) : [];
  if (data.voiceIntroUrl !== undefined && me.voiceIntroUrl && me.voiceIntroUrl !== data.voiceIntroUrl) removed.push(me.voiceIntroUrl);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: me.id },
      data: {
        ...data,
        ...(latitude !== undefined && longitude !== undefined && { latitude: roundCoord(latitude), longitude: roundCoord(longitude) }),
        ...(acceptTerms && !me.acceptedTermsAt && { acceptedTermsAt: new Date() }),
        ...(sensitiveConsent && !me.sensitiveConsentAt && { sensitiveConsentAt: new Date() }),
        ...(data.photos && data.photos.join() !== me.photos.join() && { photosUpdatedAt: new Date() }),
      },
    }),
    // Files the user removed get deleted from storage by the purge-media job.
    ...removed
      .filter((u) => u.startsWith(OUR_MEDIA))
      .map((u) => prisma.mediaDeletion.upsert({ where: { path: u.slice(OUR_MEDIA.length) }, create: { path: u.slice(OUR_MEDIA.length) }, update: {} })),
  ]);

  return new Response("OK");
}
