// On-device explicit-photo check before upload. Loaded only when someone picks a photo (~4MB, cached after).
// Reports + admin photo review catch anything this misses; it's the first line, not the only one.

let modelPromise: Promise<{ classify: (img: HTMLImageElement) => Promise<{ className: string; probability: number }[]> }> | null = null;

async function model() {
  // Model files live in public/nsfw (extracted from nsfwjs's MobileNetV2) so they aren't pushed through the bundler.
  modelPromise ??= import("nsfwjs/core").then(({ load }) => load("/nsfw/", { size: 224 }));
  return modelPromise;
}

/** True if the image looks explicit. Fails open (false) if the check can't run, e.g. HEIC or an old phone. */
export async function looksExplicit(file: File): Promise<boolean> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const predictions = await (await model()).classify(img);
    const p = (name: string) => predictions.find((x) => x.className === name)?.probability ?? 0;
    // "Sexy" (swimwear, gym photos) is allowed; only clear porn/hentai is blocked.
    return p("Porn") + p("Hentai") > 0.7;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}
