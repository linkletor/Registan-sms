import { db } from "@/db";
import { lessons, attendance, students, groups } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { visibleGroupIds, type CurrentUser } from "@/lib/scope";

export async function getLessonForGroupAndDate(groupId: string, date: string) {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.groupId, groupId), eq(lessons.date, date)))
    .limit(1);
  return lesson ?? null;
}

export async function getAttendanceSheet(
  groupId: string,
  date: string,
  user: CurrentUser,
) {
  const allowedGroupIds = await visibleGroupIds(user);
  if (allowedGroupIds && !allowedGroupIds.includes(groupId)) return null;

  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group) return null;

  const roster = await db
    .select()
    .from(students)
    .where(and(eq(students.groupId, groupId), eq(students.status, "ACTIVE")));

  const lesson = await getLessonForGroupAndDate(groupId, date);
  const existing = lesson
    ? await db.select().from(attendance).where(eq(attendance.lessonId, lesson.id))
    : [];
  const byStudent = new Map(existing.map((e) => [e.studentId, e.status]));

  return {
    group,
    lesson,
    roster: roster
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
      .map((s) => ({ student: s, status: byStudent.get(s.id) ?? "PRESENT" })),
  };
}
