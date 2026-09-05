import { db } from "@/db";
import {
  exams,
  examTopics,
  examResults,
  topicResults,
  topics,
  subjects,
  groups,
  students,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { visibleGroupIds, type CurrentUser } from "@/lib/scope";
import { pct } from "@/lib/calc";

export async function listSubjects() {
  return db.select().from(subjects).orderBy(subjects.name);
}

export async function listExams(user: CurrentUser) {
  const allowedGroupIds = await visibleGroupIds(user);

  const rows = await db
    .select({
      id: exams.id,
      name: exams.name,
      date: exams.date,
      maxScore: exams.maxScore,
      groupId: exams.groupId,
      groupName: groups.name,
      groupGrade: groups.grade,
      subjectName: subjects.name,
    })
    .from(exams)
    .innerJoin(groups, eq(exams.groupId, groups.id))
    .innerJoin(subjects, eq(exams.subjectId, subjects.id));

  const filtered = allowedGroupIds
    ? rows.filter((r) => allowedGroupIds.includes(r.groupId))
    : rows;

  return filtered.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getExamDetail(examId: string, user: CurrentUser) {
  const allowedGroupIds = await visibleGroupIds(user);

  const [exam] = await db
    .select({
      id: exams.id,
      name: exams.name,
      date: exams.date,
      maxScore: exams.maxScore,
      groupId: exams.groupId,
      groupName: groups.name,
      groupGrade: groups.grade,
      subjectId: exams.subjectId,
      subjectName: subjects.name,
    })
    .from(exams)
    .innerJoin(groups, eq(exams.groupId, groups.id))
    .innerJoin(subjects, eq(exams.subjectId, subjects.id))
    .where(eq(exams.id, examId))
    .limit(1);

  if (!exam) return null;
  if (allowedGroupIds && !allowedGroupIds.includes(exam.groupId)) return null;

  const examTopicRows = await db
    .select({
      id: examTopics.id,
      topicId: examTopics.topicId,
      name: topics.name,
      maxPoints: examTopics.maxPoints,
      orderIndex: examTopics.orderIndex,
    })
    .from(examTopics)
    .innerJoin(topics, eq(examTopics.topicId, topics.id))
    .where(eq(examTopics.examId, examId))
    .orderBy(examTopics.orderIndex);

  const roster = await db
    .select()
    .from(students)
    .where(eq(students.groupId, exam.groupId));

  const resultRows = await db
    .select()
    .from(examResults)
    .where(eq(examResults.examId, examId));

  const resultIds = resultRows.map((r) => r.id);
  const fullTopicResults = resultIds.length
    ? await db.select().from(topicResults).where(inArray(topicResults.examResultId, resultIds))
    : [];

  const resultsByStudent = new Map(resultRows.map((r) => [r.studentId, r]));
  const topicResultsByResult = new Map<string, typeof fullTopicResults>();
  for (const tr of fullTopicResults) {
    const arr = topicResultsByResult.get(tr.examResultId) ?? [];
    arr.push(tr);
    topicResultsByResult.set(tr.examResultId, arr);
  }

  const rosterRows = roster
    .filter((s) => s.status === "ACTIVE")
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((s) => {
      const result = resultsByStudent.get(s.id);
      const tr = result ? topicResultsByResult.get(result.id) ?? [] : [];
      const scoresByExamTopic = new Map(tr.map((t) => [t.examTopicId, t.score]));
      return {
        student: s,
        result: result ?? null,
        scores: examTopicRows.map((et) => ({
          examTopicId: et.id,
          score: scoresByExamTopic.get(et.id) ?? null,
        })),
      };
    });

  return { exam, examTopics: examTopicRows, roster: rosterRows };
}

export function computeRowTotal(
  scores: { examTopicId: string; score: number | null }[],
  examTopics: { id: string; maxPoints: number }[],
) {
  const maxScore = examTopics.reduce((a, t) => a + t.maxPoints, 0);
  const total = scores.reduce((a, s) => a + (s.score ?? 0), 0);
  return { total, maxScore, percentage: pct(total, maxScore) };
}
