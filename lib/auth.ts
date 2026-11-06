import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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

/**
 * The signed-in user, fresh from the database, or null if signed out or banned.
 * Use this in every route instead of trusting the session alone, so bans and
 * admin changes take effect immediately.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.banned) return null;

  // At most one write per 10 minutes, for the admin "active today" count.
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > 10 * 60_000) {
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  }
  return user;
}
