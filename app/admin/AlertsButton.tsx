"use client";
import { useEffect, useState } from "react";
import { enablePush, pushSupported } from "@/lib/push-client";
import Icon from "../components/Icon";

// Lets this device receive admin alerts: new reports, selfies to review, server errors.
export default function AlertsButton() {
  const [state, setState] = useState<"" | "on" | "off" | "unsupported" | "busy">("");
  useEffect(() => {
    // Reading browser permission must wait until mount (no `Notification` on the server).
    const ready = pushSupported();
    setState(!ready ? "unsupported" : Notification.permission === "granted" ? "on" : "off");
  }, []);
  if (state === "" || state === "unsupported") return null;
  if (state === "on") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
        <Icon name="checkmark-circle" className="h-4 w-4" /> Alerts on
      </span>
    );
  }
  return (
    <button
      onClick={async () => { setState("busy"); setState((await enablePush()) === "granted" ? "on" : "off"); }}
      disabled={state === "busy"}
      className="rounded-full bg-[#E11D5C] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
    >
      {state === "busy" ? "Turning on…" : "Turn on alerts"}
    </button>
  );
}
