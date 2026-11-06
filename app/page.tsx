"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/swipe");
  }, [status, router]);

  return (
    <main className="flex min-h-[calc(100dvh-env(safe-area-inset-top))] flex-col items-center justify-center bg-gradient-to-b from-pink-100 to-purple-100 px-6 text-center">
      <h1 className="text-5xl font-extrabold text-primary">Twain</h1>
      <p className="mt-3 max-w-xs text-lg text-gray-700">
        Voice intros, vibe checks, and people who actually reply.
      </p>
      <button
        onClick={() => signIn("google", { callbackUrl: "/swipe" })}
        disabled={status === "loading"}
        className="mt-10 w-full max-w-xs rounded-full bg-primary py-4 text-lg font-semibold text-white shadow-lg disabled:opacity-60"
      >
        Sign in with Google
      </button>
    </main>
  );
}
