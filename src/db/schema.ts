// ---------------------------------------------------------------------------
// Registan SMS — Database schema (Drizzle ORM / SQLite)
//
// Entities: users, parents, groups, students, subjects, topics, exams,
// examTopics, examResults, topicResults, lessons, attendance, teacherNotes,
// auditLogs.
//
// Designed to scale to thousands of students: every foreign key is indexed,
// heavy list queries (students by group, results by exam, attendance by
// lesson) all have a supporting index. SQLite is used for zero-config local
// development; because every column type used here (text/integer/real) is
// standard ANSI SQL, moving to PostgreSQL later only means swapping the
// driver (see README "Scaling to PostgreSQL").
// ---------------------------------------------------------------------------

import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
};

// ---------------------------------------------------------------------------
// Users & auth (Admin / Tutor roles)
// ---------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["ADMIN", "TUTOR"] })
    .notNull()
    .default("TUTOR"),
  phone: text("phone"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Parents / guardians — kept as its own entity so siblings can eventually
// share a parent record, and so parent accounts (roadmap item) have a
// natural home.
// ---------------------------------------------------------------------------
export const parents = sqliteTable("parents", {
  id: text("id").primaryKey(),
  fatherName: text("father_name"),
  fatherPhone: text("father_phone"),
  motherName: text("mother_name"),
  motherPhone: text("mother_phone"),
  parentEmail: text("parent_email"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Groups (a tutor's class, e.g. "Grade 10 — Group A")
// ---------------------------------------------------------------------------
export const groups = sqliteTable(
  "groups",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    grade: integer("grade").notNull(),
    tutorId: text("tutor_id")
      .notNull()
      .references(() => users.id),
    academicYear: text("academic_year").notNull(),
    ...timestamps,
  },
  (t) => [index("groups_tutor_idx").on(t.tutorId)],
);

// ---------------------------------------------------------------------------
// Students — the central profile record
// ---------------------------------------------------------------------------
export const students = sqliteTable(
  "students",
  {
    id: text("id").primaryKey(),
    studentCode: text("student_code").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fatherName: text("father_name"),
    dob: text("dob"),
    gender: text("gender", { enum: ["MALE", "FEMALE"] }),
    groupId: text("group_id").references(() => groups.id),
    academicLevel: text("academic_level"),
    previousLevel: text("previous_level"),
    enrollmentDate: text("enrollment_date").notNull(),
    status: text("status", { enum: ["ACTIVE", "INACTIVE"] })
      .notNull()
      .default("ACTIVE"),
    parentId: text("parent_id").references(() => parents.id),
    region: text("region"),
    district: text("district"),
    address: text("address"),
    addressExtra: text("address_extra"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("students_group_idx").on(t.groupId),
    index("students_status_idx").on(t.status),
    index("students_name_idx").on(t.lastName, t.firstName),
  ],
);

// ---------------------------------------------------------------------------
// Subjects & Topics (canonical topics let us track a topic like "Quadratic
// equations" across many different exams over time)
// ---------------------------------------------------------------------------
export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const topics = sqliteTable(
  "topics",
  {
    id: text("id").primaryKey(),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id),
    name: text("name").notNull(),
  },
  (t) => [
    index("topics_subject_idx").on(t.subjectId),
    uniqueIndex("topics_subject_name_idx").on(t.subjectId, t.name),
  ],
);

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------
export const exams = sqliteTable(
  "exams",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
    date: text("date").notNull(),
    maxScore: real("max_score").notNull().default(0),
    createdById: text("created_by_id").references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index("exams_group_idx").on(t.groupId),
    index("exams_date_idx").on(t.date),
  ],
);

// One row per topic-within-an-exam, with the max points assigned for that
// exam (the same canonical topic can carry different max points on
// different exams).
export const examTopics = sqliteTable(
  "exam_topics",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
    maxPoints: real("max_points").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => [index("exam_topics_exam_idx").on(t.examId)],
);

// One row per student per exam — the summary (total/percentage).
export const examResults = sqliteTable(
  "exam_results",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    totalScore: real("total_score").notNull().default(0),
    percentage: real("percentage").notNull().default(0),
    absent: integer("absent", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("exam_results_exam_idx").on(t.examId),
    index("exam_results_student_idx").on(t.studentId),
    uniqueIndex("exam_results_exam_student_idx").on(t.examId, t.studentId),
  ],
);

// Per-topic score for one student's result on one exam.
export const topicResults = sqliteTable(
  "topic_results",
  {
    id: text("id").primaryKey(),
    examResultId: text("exam_result_id")
      .notNull()
      .references(() => examResults.id, { onDelete: "cascade" }),
    examTopicId: text("exam_topic_id")
      .notNull()
      .references(() => examTopics.id, { onDelete: "cascade" }),
    score: real("score").notNull().default(0),
  },
  (t) => [
    index("topic_results_result_idx").on(t.examResultId),
    index("topic_results_exam_topic_idx").on(t.examTopicId),
    uniqueIndex("topic_results_result_topic_idx").on(
      t.examResultId,
      t.examTopicId,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------
export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
    date: text("date").notNull(),
    topic: text("topic"),
    ...timestamps,
  },
  (t) => [
    index("lessons_group_idx").on(t.groupId),
    index("lessons_date_idx").on(t.date),
    uniqueIndex("lessons_group_date_idx").on(t.groupId, t.date),
  ],
);

export const attendance = sqliteTable(
  "attendance",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["PRESENT", "ABSENT", "LATE", "EXCUSED"],
    })
      .notNull()
      .default("PRESENT"),
    note: text("note"),
  },
  (t) => [
    index("attendance_lesson_idx").on(t.lessonId),
    index("attendance_student_idx").on(t.studentId),
    uniqueIndex("attendance_lesson_student_idx").on(t.lessonId, t.studentId),
  ],
);

// ---------------------------------------------------------------------------
// Teacher notes & audit log
// ---------------------------------------------------------------------------
export const teacherNotes = sqliteTable(
  "teacher_notes",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => users.id),
    note: text("note").notNull(),
    ...timestamps,
  },
  (t) => [index("teacher_notes_student_idx").on(t.studentId)],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    detail: text("detail"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (t) => [index("audit_logs_entity_idx").on(t.entityType, t.entityId)],
);
