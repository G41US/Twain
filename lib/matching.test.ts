// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { genderFilter, vibeScore, calcReplyRate } from "./matching.ts";

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
  // c1: they messaged, I replied. c2: they messaged, I ignored. c3: only I messaged (doesn't count).
  // c4: I opened, they answered, I replied.
  assert.equal(calcReplyRate("me", [["x", "me"], ["y"], ["me"], ["me", "z", "me"]]), 67);
  assert.equal(calcReplyRate("me", [["me", "me"]]), null);
});
