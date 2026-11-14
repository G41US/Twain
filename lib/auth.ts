import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase";

// Local testing only: sign in as any seeded user by email. Never active in a production build.
const demoLogin =
  process.env.NODE_ENV === "development" && process.env.DEMO_LOGIN === "true"
    ? [
        CredentialsProvider({
          name: "Demo",
          credentials: { email: { label: "Email", type: "email" } },
          authorize: (c) => (c?.email ? prisma.user.findUnique({ where: { email: c.email } }) : null),
        }),
      ]
    : [];

export const authOptions: NextAuthOptions = {
  // Saves users and their Google account to the database on first sign-in.
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    ...demoLogin,
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    signIn: ({ user }) => !user.banned,
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
  },
};

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
// shortcut: per-instance cache of verified app tokens (1 min); drop if tokens must be revoked instantly.
const tokenCache = new Map<string, { email: string; name: string | null; image: string | null; until: number }>();

/** Native app: "Authorization: Bearer <Supabase access token>" → the verified email it belongs to. */
async function appIdentity() {
  const header = (await headers()).get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);

  // Local testing of the app preview: "demo:<email>" — same switch as the website's demo login, dev server only.
  if (process.env.NODE_ENV === "development" && process.env.DEMO_LOGIN === "true" && token.startsWith("demo:")) {
    return { email: token.slice(5).toLowerCase(), name: null, image: null, until: 0 };
  }

  const hit = tokenCache.get(token);
  if (hit && hit.until > Date.now()) return hit;

  // Supabase checks the signature and expiry; email/Google sign-in both prove the address.
  const { data, error } = await supabaseAuth.auth.getUser(token);
  const u = data?.user;
  if (error || !u?.email || !u.email_confirmed_at) return null;

  const id = {
    email: u.email.toLowerCase(),
    name: (u.user_metadata?.full_name ?? u.user_metadata?.name ?? null) as string | null,
    image: (u.user_metadata?.avatar_url ?? null) as string | null,
    until: Date.now() + 60_000,
  };
  if (tokenCache.size > 5000) tokenCache.clear();
  tokenCache.set(token, id);
  return id;
}

/**
 * The signed-in user, fresh from the database, or null if signed out or banned.
 * Works for the native app (Bearer token) and the website (NextAuth cookie).
 * Use this in every route instead of trusting the session alone, so bans and
 * admin changes take effect immediately.
 */
export async function getCurrentUser() {
  const app = await appIdentity();
  let user;
  if (app) {
    // Same person whether they first came in on the website or the app: matched by verified email.
    user = await prisma.user.upsert({
      where: { email: app.email },
      create: { email: app.email, name: app.name, image: app.image },
      update: {},
    });
  } else {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    user = await prisma.user.findUnique({ where: { id: session.user.id } });
  }
  if (!user || user.banned) return null;

  // At most one write per 10 minutes, for the admin "active today" count.
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > 10 * 60_000) {
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  }
  return user;
}
