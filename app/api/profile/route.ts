import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roundCoord } from "@/lib/matching";
import { photoIsExplicit } from "@/lib/moderation";
import { OUR_MEDIA, profileInput } from "@/lib/profile-input";

export const maxDuration = 60; // room for the photo check on a cold start

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

  // Every new photo is checked here, whichever app uploaded it. Rejected files are queued for deletion.
  const added = data.photos?.filter((p) => !me.photos.includes(p)) ?? [];
  const verdicts = await Promise.all(added.map((u) => photoIsExplicit(u, new URL(req.url).origin)));
  const explicit = added.filter((_, i) => verdicts[i] === true);
  if (explicit.length) {
    await prisma.mediaDeletion.createMany({ data: explicit.map((u) => ({ path: u.slice(OUR_MEDIA.length) })), skipDuplicates: true });
    return new Response("That photo looks explicit, so it can't be used. Pick another one.", { status: 400 });
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
        ...(data.voiceIntroUrl && data.voiceIntroUrl !== me.voiceIntroUrl && { voiceUpdatedAt: new Date() }),
      },
    }),
    // Files the user removed get deleted from storage by the purge-media job.
    ...removed
      .filter((u) => u.startsWith(OUR_MEDIA))
      .map((u) => prisma.mediaDeletion.upsert({ where: { path: u.slice(OUR_MEDIA.length) }, create: { path: u.slice(OUR_MEDIA.length) }, update: {} })),
  ]);

  return new Response("OK");
}
