import { db } from "@/db";
import { groups, users, students, exams, examResults, examTopics, topics, topicResults } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { visibleGroupIds, type CurrentUser } from "@/lib/scope";
import { batchPerformance } from "@/lib/data/students";
import { average, pct } from "@/lib/calc";

export async function listGroups(user: CurrentUser) {
  const allowedGroupIds = await visibleGroupIds(user);
  if (allowedGroupIds && allowedGroupIds.length === 0) return [];

  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      grade: groups.grade,
      academicYear: groups.academicYear,
      tutorId: groups.tutorId,
      tutorName: users.name,
    })
    .from(groups)
    .innerJoin(users, eq(groups.tutorId, users.id))
    .where(allowedGroupIds ? inArray(groups.id, allowedGroupIds) : undefined);

  const studentRows = await db
    .select({ id: students.id, groupId: students.groupId, status: students.status })
    .from(students)
    .where(inArray(students.groupId, rows.map((r) => r.id)));

  const studentsByGroup = new Map<string, string[]>();
  for (const s of studentRows) {
    if (!s.groupId || s.status !== "ACTIVE") continue;
    const arr = studentsByGroup.get(s.groupId) ?? [];
    arr.push(s.id);
    studentsByGroup.set(s.groupId, arr);
  }

  const perf = await batchPerformance(studentRows.map((s) => s.id));

  return rows
    .map((g) => {
      const studentIds = studentsByGroup.get(g.id) ?? [];
      const averages = studentIds
        .map((id) => perf.get(id)?.averageScore)
        .filter((v): v is number => v !== null && v !== undefined);
      const rates = studentIds
        .map((id) => perf.get(id)?.attendanceRatePct)
        .filter((v): v is number => v !== null && v !== undefined);
      return {
        ...g,
        studentCount: studentIds.length,
        averageScore: averages.length ? average(averages) : null,
        attendanceRate: rates.length ? average(rates) : null,
      };
    })
    .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
}

export async function getGroupById(id: string, user: CurrentUser) {
  const allowedGroupIds = await visibleGroupIds(user);
  if (allowedGroupIds && !allowedGroupIds.includes(id)) return null;

  const [group] = await db
    .select({
      id: groups.id,
      name: groups.name,
      grade: groups.grade,
      academicYear: groups.academicYear,
      tutorId: groups.tutorId,
      tutorName: users.name,
    })
    .from(groups)
    .innerJoin(users, eq(groups.tutorId, users.id))
    .where(eq(groups.id, id))
    .limit(1);

  if (!group) return null;

  const roster = await db
    .select()
    .from(students)
    .where(eq(students.groupId, id));

  const perf = await batchPerformance(roster.map((s) => s.id));

  return {
    group,
    roster: roster
      .map((s) => ({ ...s, perf: perf.get(s.id) }))
      .sort((a, b) => a.lastName.localeCompare(b.lastName)),
  };
}

export async function getGroupExamTrend(groupId: string) {
  const examRows = await db
    .select({ id: exams.id, name: exams.name, date: exams.date })
    .from(exams)
    .where(eq(exams.groupId, groupId));

  const examIds = examRows.map((e) => e.id);
  if (!examIds.length) return [];

  const resultRows = await db
    .select({ examId: examResults.examId, percentage: examResults.percentage })
    .from(examResults)
    .where(inArray(examResults.examId, examIds));

  const byExam = new Map<string, number[]>();
  for (const r of resultRows) {
    const arr = byExam.get(r.examId) ?? [];
    arr.push(r.percentage);
    byExam.set(r.examId, arr);
  }

  return examRows
    .map((e) => ({ label: e.name, date: e.date, percentage: average(byExam.get(e.id) ?? []) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getGroupTopicPerformance(groupId: string) {
  const examRows = await db.select({ id: exams.id }).from(exams).where(eq(exams.groupId, groupId));
  const examIds = examRows.map((e) => e.id);
  if (!examIds.length) return [];

  const rows = await db
    .select({
      topicId: topics.id,
      topicName: topics.name,
      score: topicResults.score,
      maxPoints: examTopics.maxPoints,
    })
    .from(topicResults)
    .innerJoin(examTopics, eq(topicResults.examTopicId, examTopics.id))
    .innerJoin(topics, eq(examTopics.topicId, topics.id))
    .innerJoin(examResults, eq(topicResults.examResultId, examResults.id))
    .where(inArray(examResults.examId, examIds));

  const byTopic = new Map<string, { name: string; pcts: number[] }>();
  for (const row of rows) {
    const entry = byTopic.get(row.topicId) ?? { name: row.topicName, pcts: [] };
    entry.pcts.push(pct(row.score, row.maxPoints));
    byTopic.set(row.topicId, entry);
  }

  return [...byTopic.entries()]
    .map(([topicId, { name, pcts }]) => ({ topicId, name, averagePct: average(pcts) }))
    .sort((a, b) => b.averagePct - a.averagePct);
}
