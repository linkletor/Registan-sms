import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "TUTOR";
    } & DefaultSession["user"];
  }
  interface User {
    role?: "ADMIN" | "TUTOR";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "TUTOR";
  }
}
