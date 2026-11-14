import { z } from "zod";
import { DISTANCES, INTENTION_VALUES, MAX_PROMPTS, PROMPT_MAX_CHARS, PROMPTS, TRAIT_VALUES, VIBE_QUESTIONS } from "./options";
import { BUCKET, SUPABASE_URL } from "./supabase";

// What a user may change on their own profile. Kept out of the route so the rules are unit-tested (safety.test.ts).
export const OUR_MEDIA = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
// Files we host that this user uploaded (paths are "<kind>/<userId>/<uuid>.<ext>"), or ones already on their profile.
type Me = { id: string; photos: string[]; voiceIntroUrl: string | null };
const ownMedia = (me: Me, kind: "photo" | "voice") =>
  z.string().url().refine((u) =>
    u.startsWith(`${OUR_MEDIA}${kind}/${me.id}/`) || (kind === "photo" ? me.photos.includes(u) : u === me.voiceIntroUrl));
const trait = z.enum(TRAIT_VALUES as [string, ...string[]]);

// Only these fields can be set by the user; anything else (isAdmin, verified, replyRate...) is rejected.
export const profileInput = (me: Me) =>
  z
    .object({
      bio: z.string().trim().max(500),
      age: z.number().int().min(18).max(100),
      gender: z.enum(["Male", "Female", "Non-binary", "Other"]),
      lookingFor: z.enum(["Men", "Women", "Everyone"]),
      ethnicity: z.string().max(50).nullable(),
      preferEthnicity: z.string().max(50),
      sensitiveConsent: z.boolean(),
      photos: z.array(ownMedia(me, "photo")).max(6),
      voiceIntroUrl: z.union([ownMedia(me, "voice"), z.literal("")]),
      vibeAnswers: z.record(z.enum(VIBE_QUESTIONS), z.boolean()),
      traits: z.array(trait).max(10),
      dealbreakers: z.array(trait).max(10),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      maxDistanceKm: z.number().refine((n) => (DISTANCES as readonly number[]).includes(n)),
      ageMin: z.number().int().min(18).max(100),
      ageMax: z.number().int().min(18).max(100),
      intention: z.enum(INTENTION_VALUES as [string, ...string[]]),
      prompts: z
        .array(z.object({ q: z.enum(PROMPTS as [string, ...string[]]), a: z.string().trim().min(1).max(PROMPT_MAX_CHARS) }).strict())
        .max(MAX_PROMPTS)
        .refine((ps) => new Set(ps.map((p) => p.q)).size === ps.length, "Each prompt can only be used once"),
      acceptTerms: z.literal(true),
    })
    .partial()
    .strict();

