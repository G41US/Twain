import * as tf from "@tensorflow/tfjs";
import { load, type NSFWJS } from "nsfwjs/core";
import sharp from "sharp";
import { isExplicit } from "./explicit";

// Server-side photo check: every new profile photo passes through here, whatever app uploaded it.
// shortcut: pure-JS TensorFlow (~1s per photo); switch to @tensorflow/tfjs-node or a moderation API if uploads get heavy.
let model: Promise<NSFWJS> | null = null;

/** True if the photo at `url` looks explicit, false if fine, null if it couldn't be checked (e.g. HEIC). */
export async function photoIsExplicit(url: string, origin: string): Promise<boolean | null> {
  try {
    model ??= tf.setBackend("cpu").then(() => load(`${origin}/nsfw/`, { size: 224 }));
    const res = await fetch(url);
    if (!res.ok) return null;
    const pixels = await sharp(Buffer.from(await res.arrayBuffer()))
      .rotate()
      .resize(224, 224, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer();
    const image = tf.tensor3d(new Uint8Array(pixels), [224, 224, 3], "int32");
    try {
      return isExplicit(await (await model).classify(image));
    } finally {
      image.dispose();
    }
  } catch {
    model = null; // retry loading next time
    return null;
  }
}
