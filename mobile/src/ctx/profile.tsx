import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import { useSession } from "./session";

export type Me = {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  age: number | null;
  gender: string | null;
  lookingFor: string | null;
  ethnicity: string | null;
  preferEthnicity: string | null;
  photos: string[];
  voiceIntroUrl: string | null;
  vibeAnswers: Record<string, boolean> | null;
  traits: string[];
  dealbreakers: string[];
  latitude: number | null;
  longitude: number | null;
  maxDistanceKm: number;
  ageMin: number;
  ageMax: number;
  acceptedTermsAt: string | null;
  sensitiveConsentAt: string | null;
  verified: boolean;
  selfieStatus: string | null;
  isAdmin: boolean;
};

/** Has everything the API needs before it will show you to others / show you candidates. */
export const isComplete = (m: Me | null) =>
  !!(m && m.acceptedTermsAt && m.photos?.length && m.gender && m.lookingFor && m.age && m.latitude !== null);

type Ctx = { me: Me | null; loading: boolean; error: string; refresh: () => Promise<Me | null> };
const ProfileContext = createContext<Ctx>({ me: null, loading: true, error: "", refresh: async () => null });

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session, signOut } = useSession();
  const token = session?.access_token ?? null;
  // Which session the loaded profile belongs to, so a new sign-in never sees the last user's profile.
  const [state, setState] = useState<{ me: Me | null; error: string; token: string | null }>({ me: null, error: "", token: null });

  const refresh = useCallback(async () => {
    try {
      const p = await api<Me>("/api/profile");
      setState({ me: p, error: "", token });
      return p;
    } catch (e) {
      // 401 here means the account was banned or deleted: drop the stale session.
      if (e instanceof ApiError && e.status === 401) await signOut();
      else setState((s) => ({ ...s, error: "Can't reach Twain. Check your connection.", token }));
      return null;
    }
  }, [signOut, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh only sets state after its fetch resolves
    if (token) refresh();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = !!token && state.token === token;
  const value = {
    me: current ? state.me : null,
    error: current ? state.error : "",
    loading: !!token && !current,
    refresh,
  };
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfile = () => useContext(ProfileContext);
