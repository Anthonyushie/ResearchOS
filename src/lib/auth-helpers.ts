import { auth } from "@/auth";

/** Stable per-user id used as research_records.owner_id. Null when signed out. */
export async function getOwnerId(): Promise<string | null> {
  const session = await auth();
  const user = session?.user as { id?: string; email?: string | null } | undefined;
  return user?.id || user?.email || null;
}

export async function requireOwnerId(): Promise<
  { ownerId: string } | { error: Response }
> {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return {
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ownerId };
}
