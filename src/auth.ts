// Auth.js (NextAuth v5) configuration.
//
// Sessions are stored in Postgres via the Prisma adapter rather than in a JWT
// cookie. That costs one database read per request, but it means a session can
// be revoked server-side and the session row is the single source of truth for
// who the user is. The tracker keys its data on the user id, so that matters.
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // Auth.js reads AUTH_GITHUB_ID and AUTH_GITHUB_SECRET from the environment on
  // its own, so the provider needs no arguments here.
  providers: [GitHub],

  // Explicit even though the adapter already implies it, because it is the one
  // decision a reader is most likely to want to check.
  session: { strategy: "database" },

  callbacks: {
    // With database sessions the adapter hands us the user row, but the default
    // session object only exposes name/email/image. The API routes key tracker
    // rows on the user id, so copy it across.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
