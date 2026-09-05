import { db } from "@/db";
import { exams, examResults, groups, students, subjects } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { visibleGroupIds, type CurrentUser } from "@/lib/scope";
import { batchPerformance } from "@/lib/data/students";
import { average, round1 } from "@/lib/calc";
import { getStudentExamHistory, getStudentTopicPerformance, getStudentAttendance } from "@/lib/analytics";

export type AttentionReason =
  | { type: "declining"; detail: string }
  | { type: "attendance"; detail: string }
  | { type: "weakTopic"; detail: string }
  | { type: "drop"; detail: string };

export type AttentionStudent = {
  id: string;
  name: string;
  groupName: string | null;
  reasons: AttentionReason[];
};

export async function getDashboardOverview(user: CurrentUser) {
  const allowedGroupIds = await visibleGroupIds(user);

  const studentRows = await db
    .select({ id: students.id, status: students.status, groupId: students.groupId })
    .from(students)
    .where(allowedGroupIds ? inArray(students.groupId, allowedGroupIds) : undefined);

  const activeStudents = studentRows.filter((s) => s.status === "ACTIVE");
  const perf = await batchPerformance(activeStudents.map((s) => s.id));

  const averages = [...perf.values()].map((p) => p.averageScore).filter((v): v is number => v !== null);
  const rates = [...perf.values()].map((p) => p.attendanceRatePct).filter((v): v is number => v !== null);

  let improving = 0;
  let declining = 0;
  for (const p of perf.values()) {
    if (p.trend >= 5) improving += 1;
    else if (p.trend <= -5) declining += 1;
  }

  const attention = await getStudentsNeedingAttention(user);

  return {
    totalStudents: activeStudents.length,
    averageScore: averages.length ? average(averages) : null,
    averageAttendance: rates.length ? average(rates) : null,
    improving,
    declining,
    atRisk: attention.length,
  };
}

export async function getRecentExams(user: CurrentUser, limit = 8) {
  const allowedGroupIds = await visibleGroupIds(user);

  const rows = await db
    .select({
      id: exams.id,
      name: exams.name,
      date: exams.date,
      groupName: groups.name,
      subjectName: subjects.name,
    })
    .from(exams)
    .innerJoin(groups, eq(exams.groupId, groups.id))
    .innerJoin(subjects, eq(exams.subjectId, subjects.id))
    .where(allowedGroupIds ? inArray(exams.groupId, allowedGroupIds) : undefined);

  const examIds = rows.map((r) => r.id);
  const resultRows = examIds.length
    ? await db
        .select({ examId: examResults.examId, percentage: examResults.percentage })
        .from(examResults)
        .where(inArray(examResults.examId, examIds))
    : [];

  const byExam = new Map<string, number[]>();
  for (const r of resultRows) {
    const arr = byExam.get(r.examId) ?? [];
    arr.push(r.percentage);
    byExam.set(r.examId, arr);
  }

  return rows
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((r) => {
      const pcts = byExam.get(r.id) ?? [];
      return {
        ...r,
        average: pcts.length ? average(pcts) : null,
        highest: pcts.length ? Math.max(...pcts) : null,
        lowest: pcts.length ? Math.min(...pcts) : null,
        submitted: pcts.length,
      };
    });
}

export async function getStudentsNeedingAttention(
  user: CurrentUser,
): Promise<AttentionStudent[]> {
  const allowedGroupIds = await visibleGroupIds(user);
  if (allowedGroupIds && allowedGroupIds.length === 0) return [];

  const rows = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      groupId: students.groupId,
      groupName: groups.name,
    })
    .from(students)
    .leftJoin(groups, eq(students.groupId, groups.id))
    .where(
      allowedGroupIds
        ? inArray(students.groupId, allowedGroupIds)
        : eq(students.status, "ACTIVE"),
    );

  const active = rows.filter((r) => r.groupId !== null);
  const perf = await batchPerformance(active.map((r) => r.id));

  const attention: AttentionStudent[] = [];

  for (const s of active) {
    const p = perf.get(s.id);
    const reasons: AttentionReason[] = [];
    const name = `${s.firstName} ${s.lastName}`;

    if (p?.trend !== undefined && p.trend <= -10) {
      reasons.push({
        type: "declining",
        detail: `Average dropped ${Math.abs(p.trend)} pts recently`,
      });
    }
    if (p?.attendanceRatePct !== null && p?.attendanceRatePct !== undefined && p.attendanceRatePct < 75) {
      reasons.push({
        type: "attendance",
        detail: `Attendance ${p.attendanceRatePct}%`,
      });
    }

    // last-exam vs previous-exam drop (absences aren't performance data, so
    // they're excluded before comparing consecutive exams)
    const history = (await getStudentExamHistory(s.id)).filter((h) => !h.absent);
    if (history.length >= 2) {
      const last = history[history.length - 1].percentage;
      const prev = history[history.length - 2].percentage;
      if (round1(last - prev) <= -13) {
        reasons.push({
          type: "drop",
          detail: `Dropped ${Math.abs(round1(last - prev))} pts vs previous exam`,
        });
      }
    }

    if (history.length >= 2) {
      const topics = await getStudentTopicPerformance(s.id);
      const weak = topics.filter((t) => t.attempts >= 3 && t.averagePct < 38);
      if (weak.length) {
        reasons.push({
          type: "weakTopic",
          detail: `${weak[0].name} average ${weak[0].averagePct}%`,
        });
      }
    }

    if (reasons.length) {
      attention.push({ id: s.id, name, groupName: s.groupName, reasons });
    }
  }

  return attention;
}

export { getStudentAttendance };
