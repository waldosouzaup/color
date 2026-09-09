import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },
  session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 30 },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 30,
    customRules: { "/sign-in/email": { window: 60, max: 5 } },
  },
  advanced: {
    cookiePrefix: "mestre-colorimetria",
    useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("https://"),
  },
  user: {
    additionalFields: {
      organizationId: { type: "string", input: false },
      role: { type: "string", input: false },
      active: { type: "boolean", input: false },
    },
  },
});
