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

  if (done) return <p className={`text-sm font-semibold ${done === "approved" ? "text-[#067647]" : "text-[#6B6170]"}`}>{done === "approved" ? "Approved" : "Rejected"}</p>;
  return (
    <div className="flex gap-2">
      <button onClick={() => decide(true)} disabled={busy} className="flex-1 rounded-lg bg-[#140A18] py-2.5 text-sm font-semibold text-white transition hover:bg-[#2A1830] disabled:opacity-50">Approve</button>
      <button onClick={() => decide(false)} disabled={busy} className="flex-1 rounded-lg border border-[#E4DCE8] bg-white py-2.5 text-sm font-semibold text-[#6B6170] transition hover:bg-[#F7F3F9] disabled:opacity-50">Reject</button>
    </div>
  );
}
