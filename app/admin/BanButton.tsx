"use client";
import { useState } from "react";

export default function BanButton({ userId, banned: initial }: { userId: string; banned: boolean }) {
  const [banned, setBanned] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!banned && !confirm("Ban this user? They'll be signed out of everything immediately.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, banned: !banned }),
    });
    setBusy(false);
    if (res.ok) setBanned(!banned);
    else alert("Failed: " + (await res.text()));
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${banned ? "bg-gray-500" : "bg-red-600"}`}
    >
      {banned ? "Unban" : "Ban"}
    </button>
  );
}
