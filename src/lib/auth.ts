import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "scholar@thedraw.archive" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const cleanEmail = credentials.email.toLowerCase().trim();

        // Fail-safe Owner Account auto-provisioning across all devices & deployed instances
        if (cleanEmail === "owner@thedraw.archive" && credentials.password === "ownerpassword123") {
          let ownerUser = await db.user.findUnique({
            where: { email: cleanEmail },
          });

          if (!ownerUser) {
            const passwordHash = await bcrypt.hash("ownerpassword123", 10);
            ownerUser = await db.user.create({
              data: {
                email: cleanEmail,
                name: "Platform Owner",
                passwordHash,
                role: "admin",
              },
            });
          } else if (ownerUser.role !== "admin") {
            ownerUser = await db.user.update({
              where: { id: ownerUser.id },
              data: { role: "admin" },
            });
          }

          return {
            id: ownerUser.id,
            email: ownerUser.email,
            name: ownerUser.name,
            role: "admin",
          };
        }

        const user = await db.user.findUnique({
          where: { email: cleanEmail },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email address or password.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid email address or password.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "user",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = (token.role as string) || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "the-draw-super-secret-key-32-chars-minimum-hash",
};
