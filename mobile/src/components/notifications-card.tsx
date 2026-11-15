import { useEffect, useState } from "react";
import { enablePush, pushPermission, type PushState } from "../lib/push";
import { Group, Row } from "./ui";

const FOOTER: Record<PushState | "", string> = {
  granted: "We'll tell you about new matches and messages.",
  denied: "Notifications are blocked. Turn them on in your phone's Settings → Apps → Twain.",
  unavailable: "Notifications aren't available on this device yet.",
  undetermined: "Get told the moment you match or someone messages you.",
  "": "",
};

/** Settings-style notifications row: shows the state, tap to turn on. */
export function NotificationsCard() {
  const [state, setState] = useState<PushState | "">("");
  useEffect(() => {
    pushPermission().then((s) => (s === "granted" ? enablePush().then(setState) : setState(s))); // re-register quietly
  }, []);

  const canAsk = state === "undetermined";
  return (
    <Group footer={FOOTER[state] || undefined}>
      <Row
        icon="notifications" title="Notifications" last
        value={state === "granted" ? "On" : state === "undetermined" ? "Turn on" : state ? "Off" : ""}
        onPress={canAsk ? async () => setState(await enablePush()) : undefined}
      />
    </Group>
  );
}
