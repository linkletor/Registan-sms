import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function listTutors() {
  return db.select().from(users).where(eq(users.active, true));
}

export async function listAllUsers() {
  return db.select().from(users);
}
