import { db } from "@/db";
import {
  students,
  groups,
  users,
  parents,
  examResults,
  exams,
  attendance,
  lessons,
  teacherNotes,
} from "@/db/schema";
import { and, eq, inArray, like, or } from "drizzle-orm";
import { visibleGroupIds, type CurrentUser } from "@/lib/scope";
import { average, attendanceRate, round1, trendDelta } from "@/lib/calc";

export type StudentFilters = {
  q?: string;
  groupId?: string;
  grade?: string;
  status?: string;
  performance?: "below60" | "below40" | "";
};

export type StudentListRow = {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  status: string;
  groupId: string | null;
  groupName: string | null;
  grade: number | null;
  tutorName: string | null;
  academicLevel: string | null;
  averageScore: number | null;
  attendanceRatePct: number | null;
  trend: number;
};

export async function listStudents(
  user: CurrentUser,
  filters: StudentFilters = {},
): Promise<StudentListRow[]> {
  const allowedGroupIds = await visibleGroupIds(user);
  if (allowedGroupIds && allowedGroupIds.length === 0) return [];

  const conditions = [];
  if (allowedGroupIds) conditions.push(inArray(students.groupId, allowedGroupIds));
  if (filters.groupId) conditions.push(eq(students.groupId, filters.groupId));
  if (filters.status) conditions.push(eq(students.status, filters.status as "ACTIVE" | "INACTIVE"));
  if (filters.grade) conditions.push(eq(groups.grade, Number(filters.grade)));
  if (filters.q) {
    const term = `%${filters.q.toLowerCase()}%`;
    conditions.push(
      or(
        like(students.firstName, term),
        like(students.lastName, term),
        like(students.studentCode, term),
      ),
    );
  }

  const rows = await db
    .select({
      id: students.id,
      studentCode: students.studentCode,
      firstName: students.firstName,
      lastName: students.lastName,
      status: students.status,
      groupId: groups.id,
      groupName: groups.name,
      grade: groups.grade,
      tutorName: users.name,
      academicLevel: students.academicLevel,
    })
    .from(students)
    .leftJoin(groups, eq(students.groupId, groups.id))
    .leftJoin(users, eq(groups.tutorId, users.id))
    .where(conditions.length ? and(...conditions) : undefined);

  const studentIds = rows.map((r) => r.id);
  const perf = await batchPerformance(studentIds);

  let result: StudentListRow[] = rows.map((r) => ({
    ...r,
    averageScore: perf.get(r.id)?.averageScore ?? null,
    attendanceRatePct: perf.get(r.id)?.attendanceRatePct ?? null,
    trend: perf.get(r.id)?.trend ?? 0,
  }));

  if (filters.performance === "below60") {
    result = result.filter((r) => r.averageScore !== null && r.averageScore < 60);
  } else if (filters.performance === "below40") {
    result = result.filter((r) => r.averageScore !== null && r.averageScore < 40);
  }

  return result.sort((a, b) => a.lastName.localeCompare(b.lastName));
}

/** Batch-computes average exam score, attendance rate, and score trend for a
 * set of student IDs in a small constant number of queries (rather than one
 * query per student), so the students list stays fast as the school grows. */
export async function batchPerformance(studentIds: string[]) {
  const result = new Map<
    string,
    { averageScore: number | null; attendanceRatePct: number | null; trend: number }
  >();
  if (!studentIds.length) return result;

  const examRows = await db
    .select({
      studentId: examResults.studentId,
      percentage: examResults.percentage,
      absent: examResults.absent,
      date: exams.date,
    })
    .from(examResults)
    .innerJoin(exams, eq(examResults.examId, exams.id))
    .where(inArray(examResults.studentId, studentIds));

  const attRows = await db
    .select({ studentId: attendance.studentId, status: attendance.status, date: lessons.date })
    .from(attendance)
    .innerJoin(lessons, eq(attendance.lessonId, lessons.id))
    .where(inArray(attendance.studentId, studentIds));

  const examByStudent = new Map<string, { date: string; percentage: number }[]>();
  for (const row of examRows) {
    if (row.absent) continue; // an absence isn't a performance data point
    const arr = examByStudent.get(row.studentId) ?? [];
    arr.push({ date: row.date, percentage: row.percentage });
    examByStudent.set(row.studentId, arr);
  }
  for (const arr of examByStudent.values()) arr.sort((a, b) => a.date.localeCompare(b.date));

  const attByStudent = new Map<string, { present: number; late: number; total: number }>();
  for (const row of attRows) {
    const agg = attByStudent.get(row.studentId) ?? { present: 0, late: 0, total: 0 };
    agg.total += 1;
    if (row.status === "PRESENT") agg.present += 1;
    if (row.status === "LATE") agg.late += 1;
    attByStudent.set(row.studentId, agg);
  }

  for (const id of studentIds) {
    const percentages = (examByStudent.get(id) ?? []).map((e) => e.percentage);
    const att = attByStudent.get(id);
    result.set(id, {
      averageScore: percentages.length ? average(percentages) : null,
      attendanceRatePct: att ? attendanceRate(att.present, att.late, att.total) : null,
      trend: percentages.length >= 2 ? trendDelta(percentages) : 0,
    });
  }
  return result;
}

export async function getStudentById(id: string, user: CurrentUser) {
  const allowedGroupIds = await visibleGroupIds(user);

  const [row] = await db
    .select({
      student: students,
      group: groups,
      tutor: users,
      parent: parents,
    })
    .from(students)
    .leftJoin(groups, eq(students.groupId, groups.id))
    .leftJoin(users, eq(groups.tutorId, users.id))
    .leftJoin(parents, eq(students.parentId, parents.id))
    .where(eq(students.id, id))
    .limit(1);

  if (!row) return null;
  if (allowedGroupIds && (!row.student.groupId || !allowedGroupIds.includes(row.student.groupId))) {
    return null; // not authorized
  }
  return row;
}

export async function listAllGroupsForForm(user: CurrentUser) {
  const allowedGroupIds = await visibleGroupIds(user);
  const rows = await db
    .select({ id: groups.id, name: groups.name, grade: groups.grade })
    .from(groups)
    .where(allowedGroupIds ? inArray(groups.id, allowedGroupIds) : undefined);
  return rows.sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
}

export function round(n: number) {
  return round1(n);
}

export async function getTeacherNotes(studentId: string) {
  const rows = await db
    .select({
      id: teacherNotes.id,
      note: teacherNotes.note,
      createdAt: teacherNotes.createdAt,
      authorName: users.name,
    })
    .from(teacherNotes)
    .leftJoin(users, eq(teacherNotes.authorId, users.id))
    .where(eq(teacherNotes.studentId, studentId));

  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
