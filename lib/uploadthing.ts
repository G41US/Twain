import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCurrentUser } from "@/lib/auth";

const f = createUploadthing();

async function signedIn() {
  const me = await getCurrentUser();
  if (!me) throw new UploadThingError("Unauthorized");
  return { userId: me.id };
}

export const uploadRouter = {
  photo: f({ image: { maxFileSize: "4MB", maxFileCount: 6 } })
    .middleware(signedIn)
    .onUploadComplete(() => {}),
  voice: f({ audio: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(signedIn)
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
