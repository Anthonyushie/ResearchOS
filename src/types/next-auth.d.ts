import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Stable per-user id (= research_records.owner_id) */
      id: string;
    } & DefaultSession["user"];
  }
}
