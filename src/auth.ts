import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return url;

      try {
        const nextUrl = new URL(url);
        if (nextUrl.origin === baseUrl) {
          return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
        }
      } catch {
        return baseUrl;
      }

      return baseUrl;
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const googleProfile = profile as { email_verified?: boolean } | undefined;
        return googleProfile?.email_verified === true;
      }

      return true;
    },
    async jwt({ token, account, user }) {
      if (account && account.provider === "google") {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
      }
      if (user) {
        token.id = user.id;
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        token.role = dbUser?.role ?? "PATIENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.googleAccessToken = token.googleAccessToken as string | undefined;
      }
      return session;
    },
  },
});
