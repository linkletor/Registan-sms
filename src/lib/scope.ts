// A tutor only ever sees groups they own (and the students inside them).
// Admins see everything. This is the single choke point every data-access
// function funnels through, so authorization can't be forgotten on a new
// query.

import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CurrentUser = { id: string; role: "ADMIN" | "TUTOR" };

/** Returns the list of group IDs a user is allowed to see, or `null` when
 * the user is an admin and can see all groups (no filter needed). */
export async function visibleGroupIds(
  user: CurrentUser,
): Promise<string[] | null> {
  if (user.role === "ADMIN") return null;
  const rows = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.tutorId, user.id));
  return rows.map((r) => r.id);
}
