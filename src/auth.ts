import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Vercel sets host headers; trust them so callback URLs work in prod
  // without hardcoding AUTH_URL. Localhost works the same way.
  trustHost: true,
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist Google profile info + stable owner id on first sign-in
      if (account && profile) {
        token.ownerId =
          token.sub ??
          (profile as { sub?: string }).sub ??
          token.email ??
          "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Stable per-user id used as research_records.owner_id
        (session.user as { id?: string }).id =
          (token.ownerId as string | undefined) ??
          token.sub ??
          session.user.email ??
          "";
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;

      // Public: login, auth handlers, static assets
      if (
        pathname === "/login" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js)$/)
      ) {
        return true;
      }

      // Everything else (pages + data APIs) requires login
      return !!session?.user;
    },
  },
});
