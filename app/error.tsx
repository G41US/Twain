"use client";
import { useEffect } from "react";

export default function ErrorScreen({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${error.name}: ${error.message}`, path: location.pathname }),
    }).catch(() => {});
  }, [error]);

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold">Something went wrong 😕</h1>
      <p className="mt-2 text-gray-600">We&apos;ve been told about it. Try again.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-white">Try again</button>
    </main>
  );
}
