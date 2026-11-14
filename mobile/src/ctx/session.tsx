import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEMO_EMAIL } from "../lib/config";
import { supabase } from "../lib/supabase";

type Ctx = { session: Session | null; loading: boolean; signOut: () => Promise<void> };
const SessionContext = createContext<Ctx>({ session: null, loading: true, signOut: async () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(
    DEMO_EMAIL ? ({ access_token: `demo:${DEMO_EMAIL}`, user: { email: DEMO_EMAIL } } as Session) : null,
  );
  const [loading, setLoading] = useState(!DEMO_EMAIL);

  useEffect(() => {
    if (DEMO_EMAIL) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (DEMO_EMAIL) return setSession(null);
    await supabase.auth.signOut();
  };

  return <SessionContext.Provider value={{ session, loading, signOut }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
