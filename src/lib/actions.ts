"use server";

import { db } from "@/db";
import {
  students,
  parents,
  groups,
  users,
  subjects,
  topics,
  exams,
  examTopics,
  examResults,
  topicResults,
  lessons,
  attendance,
  teacherNotes,
  auditLogs,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { visibleGroupIds } from "@/lib/scope";
import { makeId } from "@/lib/id";
import { pct } from "@/lib/calc";

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Admins only.");
  return user;
}

async function log(userId: string, action: string, entityType: string, entityId?: string, detail?: string) {
  await db.insert(auditLogs).values({
    id: makeId("log"),
    userId,
    action,
    entityType,
    entityId,
    detail,
  });
}

async function assertGroupVisible(groupId: string, user: { id: string; role: string }) {
  const allowed = await visibleGroupIds(user as never);
  if (allowed && !allowed.includes(groupId)) {
    throw new Error("You do not have access to this group.");
  }
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export type StudentFormInput = {
  id?: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  dob?: string;
  gender?: "MALE" | "FEMALE" | "";
  groupId: string;
  academicLevel?: string;
  previousLevel?: string;
  enrollmentDate: string;
  status: "ACTIVE" | "INACTIVE";
  region?: string;
  district?: string;
  address?: string;
  addressExtra?: string;
  notes?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  parentEmail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

export async function upsertStudent(input: StudentFormInput) {
  const user = await requireUser();
  await assertGroupVisible(input.groupId, user);

  let parentId: string | null = null;
  if (input.id) {
    const [existing] = await db.select().from(students).where(eq(students.id, input.id)).limit(1);
    parentId = existing?.parentId ?? null;
  }

  const parentPayload = {
    fatherName: input.fatherName || null,
    fatherPhone: input.fatherPhone || null,
    motherName: input.motherName || null,
    motherPhone: input.motherPhone || null,
    parentEmail: input.parentEmail || null,
    emergencyContactName: input.emergencyContactName || null,
    emergencyContactPhone: input.emergencyContactPhone || null,
    updatedAt: new Date().toISOString(),
  };

  if (parentId) {
    await db.update(parents).set(parentPayload).where(eq(parents.id, parentId));
  } else {
    parentId = makeId("parent");
    await db.insert(parents).values({ id: parentId, ...parentPayload });
  }

  const studentPayload = {
    studentCode: input.studentCode,
    firstName: input.firstName,
    lastName: input.lastName,
    fatherName: input.fatherName || null,
    dob: input.dob || null,
    gender: input.gender || null,
    groupId: input.groupId,
    academicLevel: input.academicLevel || null,
    previousLevel: input.previousLevel || null,
    enrollmentDate: input.enrollmentDate,
    status: input.status,
    region: input.region || null,
    district: input.district || null,
    address: input.address || null,
    addressExtra: input.addressExtra || null,
    notes: input.notes || null,
    parentId,
    updatedAt: new Date().toISOString(),
  };

  let id = input.id;
  if (id) {
    await db.update(students).set(studentPayload).where(eq(students.id, id));
    await log(user.id, "UPDATE", "student", id);
  } else {
    id = makeId("stu");
    await db.insert(students).values({ id, ...studentPayload });
    await log(user.id, "CREATE", "student", id);
  }

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return { id };
}

export async function addTeacherNote(studentId: string, note: string) {
  const user = await requireUser();
  await db.insert(teacherNotes).values({
    id: makeId("note"),
    studentId,
    authorId: user.id,
    note,
  });
  await log(user.id, "CREATE", "teacherNote", studentId);
  revalidatePath(`/students/${studentId}`);
}

// ---------------------------------------------------------------------------
// Groups & Users (admin)
// ---------------------------------------------------------------------------

export async function createGroup(input: { name: string; grade: number; tutorId: string; academicYear: string }) {
  const user = await requireAdmin();
  const id = makeId("grp");
  await db.insert(groups).values({ id, ...input });
  await log(user.id, "CREATE", "group", id);
  revalidatePath("/groups");
  return { id };
}

export async function createTutor(input: { name: string; email: string; password: string; phone?: string }) {
  const user = await requireAdmin();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const id = makeId("usr");
  await db.insert(users).values({
    id,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: "TUTOR",
    phone: input.phone || null,
  });
  await log(user.id, "CREATE", "user", id);
  revalidatePath("/settings");
  return { id };
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

export async function createExam(input: {
  name: string;
  subjectName: string;
  groupId: string;
  date: string;
  topicList: { name: string; maxPoints: number }[];
}) {
  const user = await requireUser();
  await assertGroupVisible(input.groupId, user);

  let [subject] = await db.select().from(subjects).where(eq(subjects.name, input.subjectName)).limit(1);
  if (!subject) {
    const subjectId = makeId("sub");
    await db.insert(subjects).values({ id: subjectId, name: input.subjectName });
    subject = { id: subjectId, name: input.subjectName };
  }

  const topicIds: string[] = [];
  for (const t of input.topicList) {
    let [topic] = await db
      .select()
      .from(topics)
      .where(and(eq(topics.subjectId, subject.id), eq(topics.name, t.name)))
      .limit(1);
    if (!topic) {
      const topicId = makeId("top");
      await db.insert(topics).values({ id: topicId, subjectId: subject.id, name: t.name });
      topic = { id: topicId, subjectId: subject.id, name: t.name };
    }
    topicIds.push(topic.id);
  }

  const maxScore = input.topicList.reduce((a, t) => a + t.maxPoints, 0);
  const examId = makeId("exam");
  await db.insert(exams).values({
    id: examId,
    name: input.name,
    subjectId: subject.id,
    groupId: input.groupId,
    date: input.date,
    maxScore,
    createdById: user.id,
  });

  await db.insert(examTopics).values(
    input.topicList.map((t, i) => ({
      id: makeId("etop"),
      examId,
      topicId: topicIds[i],
      maxPoints: t.maxPoints,
      orderIndex: i,
    })),
  );

  await log(user.id, "CREATE", "exam", examId);
  revalidatePath("/exams");
  return { id: examId };
}

export async function saveExamResults(
  examId: string,
  rows: { studentId: string; scores: { examTopicId: string; score: number | null }[]; absent?: boolean }[],
) {
  const user = await requireUser();

  const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
  if (!exam) throw new Error("Exam not found.");
  await assertGroupVisible(exam.groupId, user);

  const examTopicRows = await db.select().from(examTopics).where(eq(examTopics.examId, examId));
  const maxScore = examTopicRows.reduce((a, t) => a + t.maxPoints, 0);

  for (const row of rows) {
    const total = row.absent ? 0 : row.scores.reduce((a, s) => a + (s.score ?? 0), 0);
    const percentage = row.absent ? 0 : pct(total, maxScore);

    const [existing] = await db
      .select()
      .from(examResults)
      .where(and(eq(examResults.examId, examId), eq(examResults.studentId, row.studentId)))
      .limit(1);

    let examResultId = existing?.id;
    if (existing) {
      await db
        .update(examResults)
        .set({ totalScore: total, percentage, absent: !!row.absent, updatedAt: new Date().toISOString() })
        .where(eq(examResults.id, existing.id));
    } else {
      examResultId = makeId("res");
      await db.insert(examResults).values({
        id: examResultId,
        examId,
        studentId: row.studentId,
        totalScore: total,
        percentage,
        absent: !!row.absent,
      });
    }

    for (const s of row.scores) {
      const [existingTopicResult] = await db
        .select()
        .from(topicResults)
        .where(
          and(eq(topicResults.examResultId, examResultId!), eq(topicResults.examTopicId, s.examTopicId)),
        )
        .limit(1);

      if (existingTopicResult) {
        await db
          .update(topicResults)
          .set({ score: s.score ?? 0 })
          .where(eq(topicResults.id, existingTopicResult.id));
      } else {
        await db.insert(topicResults).values({
          id: makeId("tres"),
          examResultId: examResultId!,
          examTopicId: s.examTopicId,
          score: s.score ?? 0,
        });
      }
    }
  }

  await log(user.id, "UPDATE", "examResults", examId, `${rows.length} students`);
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function saveAttendance(
  groupId: string,
  date: string,
  topic: string | undefined,
  entries: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" }[],
) {
  const user = await requireUser();
  await assertGroupVisible(groupId, user);

  let [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.groupId, groupId), eq(lessons.date, date)))
    .limit(1);

  if (!lesson) {
    const id = makeId("lsn");
    await db.insert(lessons).values({ id, groupId, date, topic: topic || null });
    lesson = { id, groupId, date, topic: topic || null, createdAt: "", updatedAt: "" };
  } else if (topic) {
    await db.update(lessons).set({ topic }).where(eq(lessons.id, lesson.id));
  }

  for (const entry of entries) {
    const [existing] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.lessonId, lesson.id), eq(attendance.studentId, entry.studentId)))
      .limit(1);

    if (existing) {
      await db.update(attendance).set({ status: entry.status }).where(eq(attendance.id, existing.id));
    } else {
      await db.insert(attendance).values({
        id: makeId("att"),
        lessonId: lesson.id,
        studentId: entry.studentId,
        status: entry.status,
      });
    }
  }

  await log(user.id, "UPDATE", "attendance", lesson.id, `${entries.length} students`);
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
}
