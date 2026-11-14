import { useEffect, useState } from "react";
import { enablePush, pushPermission, type PushState } from "../lib/push";
import { PillButton } from "./profile-form";
import { Card, Notice, T } from "./ui";

export function NotificationsCard() {
  const [state, setState] = useState<PushState | "">("");
  useEffect(() => {
    pushPermission().then((s) => (s === "granted" ? enablePush().then(setState) : setState(s))); // re-register quietly
  }, []);

  if (state === "granted") return <Notice tone="success" icon="notifications" text="Notifications are on. We'll tell you about new matches and messages." />;
  if (state === "denied") return <Card tint="#FEF9C3"><T style={{ color: "#713F12" }}>Notifications are blocked. Turn them on in your phone&apos;s Settings → Apps → Twain.</T></Card>;
  if (state === "unavailable") return <Card tint="#F4F4F5"><T variant="small">Notifications aren&apos;t available on this device yet.</T></Card>;
  return (
    <Card tint="#FEF9C3">
      <T style={{ color: "#713F12" }}>Get told the moment you match or someone messages you.</T>
      <PillButton icon="notifications" label="Turn on notifications" onPress={async () => setState(await enablePush())} color="#CA8A04" />
    </Card>
  );
}
