// Safety rules that must never silently break. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { isExplicit } from "./explicit.ts";
import { candidateWhere, fitsBothWays } from "./matching.ts";
import { OUR_MEDIA, profileInput } from "./profile-input.ts";

const me = {
  id: "me", gender: "Male", lookingFor: "Women", age: 27, ageMin: 21, ageMax: 32,
  latitude: 6.45, longitude: 3.47, maxDistanceKm: 50, preferEthnicity: "all",
  photos: [] as string[], voiceIntroUrl: null as string | null,
};

test("Discover never shows yourself, banned or unfinished profiles", () => {
  const w = candidateWhere(me);
  assert.deepEqual(w.id, { not: "me" });
  assert.equal(w.banned, false);
  assert.deepEqual(w.acceptedTermsAt, { not: null });
  assert.deepEqual(w.photos, { isEmpty: false });
});

test("Discover hides anyone blocked in either direction, and people already liked or passed", () => {
  const w = candidateWhere(me);
  assert.deepEqual(w.blocksMade, { none: { blockedId: "me" } }); // they blocked me
  assert.deepEqual(w.blocksReceived, { none: { blockerId: "me" } }); // I blocked them
  assert.deepEqual(w.likesReceived, { none: { likerId: "me" } });
  assert.deepEqual(w.passesReceived, { none: { passerId: "me" } });
});

test("Discover respects both people's age and gender wishes", () => {
  const w = candidateWhere(me);
  assert.deepEqual(w.age, { gte: 21, lte: 32 }); // they're in my range
  assert.deepEqual(w.ageMin, { lte: 27 }); // I'm in theirs
  assert.deepEqual(w.ageMax, { gte: 27 });
  assert.equal(w.gender, "Female");
  assert.deepEqual(w.lookingFor, { in: ["Men", "Everyone"] });
});

test("ethnicity preference only filters when set", () => {
  assert.equal("ethnicity" in candidateWhere(me), false);
  assert.equal(candidateWhere({ ...me, preferEthnicity: "igbo" }).ethnicity, "igbo");
});

test("distance must suit both people, and dealbreakers apply both ways", () => {
  const a = { maxDistanceKm: 50, traits: [], dealbreakers: ["smokes"] };
  const b = { maxDistanceKm: 10, traits: [], dealbreakers: [] };
  assert.equal(fitsBothWays(a, b, 8), true);
  assert.equal(fitsBothWays(a, b, 20), false); // within mine, outside theirs
  assert.equal(fitsBothWays(a, { ...b, traits: ["smokes"] }, 5), false);
  assert.equal(fitsBothWays({ ...a, dealbreakers: [], traits: ["smokes"] }, { ...b, dealbreakers: ["smokes"] }, 5), false);
});

test("nobody under 18 can save a profile or ask to see under-18s", () => {
  const schema = profileInput(me);
  assert.equal(schema.safeParse({ age: 17 }).success, false);
  assert.equal(schema.safeParse({ age: 18 }).success, true);
  assert.equal(schema.safeParse({ ageMin: 16 }).success, false);
});

test("users can't give themselves admin, verified or unban status", () => {
  const schema = profileInput(me);
  for (const field of ["isAdmin", "verified", "banned", "replyRate", "selfieStatus"]) {
    assert.equal(schema.safeParse({ [field]: true }).success, false, field);
  }
});

test("photos and voice notes must be the user's own uploads, in the right folder", () => {
  const schema = profileInput(me);
  assert.equal(schema.safeParse({ photos: [`${OUR_MEDIA}photo/me/a.jpg`] }).success, true);
  assert.equal(schema.safeParse({ photos: [`${OUR_MEDIA}photo/someone-else/a.jpg`] }).success, false);
  assert.equal(schema.safeParse({ photos: ["https://example.com/stolen.jpg"] }).success, false);
  assert.equal(schema.safeParse({ photos: [`${OUR_MEDIA}voice/me/a.m4a`] }).success, false);
  assert.equal(schema.safeParse({ voiceIntroUrl: `${OUR_MEDIA}voice/me/a.m4a` }).success, true);
  assert.equal(schema.safeParse({ voiceIntroUrl: `${OUR_MEDIA}photo/me/a.jpg` }).success, false);
  assert.equal(schema.safeParse({ photos: Array.from({ length: 7 }, (_, i) => `${OUR_MEDIA}photo/me/${i}.jpg`) }).success, false);
});

test("terms can only be accepted, never un-accepted", () => {
  assert.equal(profileInput(me).safeParse({ acceptTerms: false }).success, false);
});

test("explicit-photo rule blocks porn but allows swimwear", () => {
  assert.equal(isExplicit([{ className: "Porn", probability: 0.8 }]), true);
  assert.equal(isExplicit([{ className: "Porn", probability: 0.4 }, { className: "Hentai", probability: 0.4 }]), true);
  assert.equal(isExplicit([{ className: "Sexy", probability: 0.95 }]), false);
  assert.equal(isExplicit([{ className: "Neutral", probability: 0.99 }]), false);
});

test("prompts: known questions only, short answers, at most 3, no repeats", () => {
  const schema = profileInput(me);
  assert.equal(schema.safeParse({ prompts: [{ q: "My ideal weekend", a: "Beach, suya, no phone." }] }).success, true);
  assert.equal(schema.safeParse({ prompts: [{ q: "Send me your bank details", a: "x" }] }).success, false);
  assert.equal(schema.safeParse({ prompts: [{ q: "My ideal weekend", a: "x".repeat(151) }] }).success, false);
  assert.equal(schema.safeParse({ prompts: [{ q: "My ideal weekend", a: "   " }] }).success, false);
  const twice = [{ q: "My ideal weekend", a: "a" }, { q: "My ideal weekend", a: "b" }];
  assert.equal(schema.safeParse({ prompts: twice }).success, false);
  const four = ["My simple pleasure", "We'll get along if", "A perfect first date", "My ideal weekend"].map((q) => ({ q, a: "yes" }));
  assert.equal(schema.safeParse({ prompts: four }).success, false);
  assert.equal(schema.safeParse({ intention: "hookups-only" }).success, false);
  assert.equal(schema.safeParse({ intention: "serious" }).success, true);
});
