import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

// A hash of an unguessable, never-issued password -- compared against when
// no account exists, so authorize() always pays the same bcrypt cost whether
// or not the email is registered. Without this, an early return skips the
// hash entirely, and the timing difference lets an attacker enumerate
// registered emails by how long login takes to fail.
const DUMMY_PASSWORD_HASH =
  "$2b$10$MdfphU./7ZFalRNXZxdDJ.1oZOYq7yaLMivfeQ605/r5M.6cjy4qW";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await prisma.user.findUnique({ where: { email } });

        const passwordMatches = await compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
        if (!user || !passwordMatches) return null;
        if (user.suspended) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
