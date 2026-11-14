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
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${banned ? "border-[#E4DCE8] bg-white text-[#6B6170] hover:bg-[#F7F3F9]" : "border-[#F5C2C0] bg-white text-[#B42318] hover:bg-[#FDECEC]"}`}
    >
      {banned ? "Unban" : "Ban"}
    </button>
  );
}
