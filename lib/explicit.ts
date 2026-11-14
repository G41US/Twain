// The one rule for "too explicit for a profile", shared by the on-device check (lib/nsfw.ts) and the server (lib/moderation.ts).
type Prediction = { className: string; probability: number };

/** "Sexy" (swimwear, gym photos) is allowed; only clear porn/hentai is blocked. */
export function isExplicit(predictions: Prediction[]): boolean {
  const p = (name: string) => predictions.find((x) => x.className === name)?.probability ?? 0;
  return p("Porn") + p("Hentai") > 0.7;
}
