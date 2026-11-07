"use client";
import { useState } from "react";

export default function VerifyButtons({ userId }: { userId: string }) {
  const [done, setDone] = useState<"" | "approved" | "rejected">("");
  const [busy, setBusy] = useState(false);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, approve }),
    });
    setBusy(false);
    if (res.ok) setDone(approve ? "approved" : "rejected");
    else alert("Failed: " + (await res.text()));
  };

  if (done) return <p className="text-sm font-semibold">{done === "approved" ? "✓ Approved" : "✕ Rejected"}</p>;
  return (
    <div className="flex gap-2">
      <button onClick={() => decide(true)} disabled={busy} className="flex-1 rounded-lg bg-green-600 py-2 font-semibold text-white disabled:opacity-50">Approve</button>
      <button onClick={() => decide(false)} disabled={busy} className="flex-1 rounded-lg bg-gray-500 py-2 font-semibold text-white disabled:opacity-50">Reject</button>
    </div>
  );
}
