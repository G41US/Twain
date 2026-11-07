// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { genderFilter, vibeScore, calcReplyRate, distanceKm, boundingBox, roundCoord, dealbreakersOk } from "./matching.ts";

test("genderFilter is mutual", () => {
  assert.deepEqual(genderFilter({ gender: "Male", lookingFor: "Women" }), {
    gender: "Female",
    lookingFor: { in: ["Men", "Everyone"] },
  });
  assert.deepEqual(genderFilter({ gender: "Non-binary", lookingFor: "Everyone" }), {
    lookingFor: { in: ["Everyone"] },
  });
});

test("vibeScore compares shared answers only", () => {
  assert.equal(vibeScore({ a: true, b: false, c: true }, { a: true, b: true }), 50);
  assert.equal(vibeScore({ a: true }, { z: true }), null);
  assert.equal(vibeScore(null, { a: true }), null);
});

test("calcReplyRate counts replies to conversations others started or joined", () => {
  assert.equal(calcReplyRate("me", [["x", "me"], ["y"], ["me"], ["me", "z", "me"]]), 67);
  assert.equal(calcReplyRate("me", [["me", "me"]]), null);
});

test("distanceKm matches known city distances", () => {
  const lagosAbuja = distanceKm(6.45, 3.47, 9.06, 7.49);
  assert.ok(lagosAbuja > 520 && lagosAbuja < 540, `Lagos–Abuja ${lagosAbuja}`);
  assert.equal(distanceKm(6.45, 3.47, 6.45, 3.47), 0);
});

test("boundingBox contains every point within the radius", () => {
  const box = boundingBox(6.45, 3.47, 50);
  // ~49km due east and north must be inside
  const east = 3.47 + 49 / (111 * Math.cos((6.45 * Math.PI) / 180));
  assert.ok(east <= box.longitude.lte && 6.45 + 49 / 111 <= box.latitude.lte);
});

test("roundCoord keeps ~1km precision", () => {
  assert.equal(roundCoord(6.454321), 6.45);
  assert.equal(roundCoord(-3.4567), -3.46);
});

test("dealbreakersOk checks both directions", () => {
  const smoker = { traits: ["smokes"], dealbreakers: [] };
  const hatesSmoke = { traits: [], dealbreakers: ["smokes"] };
  const easy = { traits: [], dealbreakers: [] };
  assert.equal(dealbreakersOk(smoker, hatesSmoke), false);
  assert.equal(dealbreakersOk(hatesSmoke, smoker), false);
  assert.equal(dealbreakersOk(smoker, easy), true);
});
