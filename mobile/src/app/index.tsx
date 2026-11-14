import { Redirect } from "expo-router";
import { isComplete, useProfile } from "../ctx/profile";
import { useSession } from "../ctx/session";

// "/" is just a router: send people to the right place for where they are.
export default function Index() {
  const { session } = useSession();
  const { me } = useProfile();
  return <Redirect href={!session ? "/welcome" : isComplete(me) ? "/discover" : "/setup"} />;
}
