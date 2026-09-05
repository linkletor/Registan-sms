// ---------------------------------------------------------------------------
// Core analytics engine: turns raw exam/topic/attendance rows into the
// progress, topic-performance, and attendance summaries shown throughout the
// app. Kept separate from the page components so the same numbers power the
// dashboard, the student profile, group comparisons, and printable reports.
// ---------------------------------------------------------------------------

import { db } from "@/db";
import {
  examResults,
  exams,
  topicResults,
  examTopics,
  topics,
  subjects,
  attendance,
  lessons,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { average, pct, round1, topicStatus, trendDelta } from "@/lib/calc";

export type ExamHistoryPoint = {
  examResultId: string;
  examId: string;
  name: string;
  subject: string;
  date: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  absent: boolean;
};

export type TopicPerformance = {
  topicId: string;
  name: string;
  attempts: number;
  averagePct: number;
  status: ReturnType<typeof topicStatus>;
  trend: number;
  series: { date: string; pct: number }[];
};

export type ProgressStats = {
  numExams: number;
  average: number;
  best: number;
  lowest: number;
  improvement: number;
  trend: number;
};

/** All exam results for a student, including exams they were absent for
 * (absent rows carry percentage 0 but are flagged so callers can decide
 * whether to display or exclude them). */
export async function getStudentExamHistory(
  studentId: string,
): Promise<ExamHistoryPoint[]> {
  const rows = await db
    .select({
      examResultId: examResults.id,
      examId: exams.id,
      name: exams.name,
      subject: subjects.name,
      date: exams.date,
      totalScore: examResults.totalScore,
      maxScore: exams.maxScore,
      percentage: examResults.percentage,
      absent: examResults.absent,
    })
    .from(examResults)
    .innerJoin(exams, eq(examResults.examId, exams.id))
    .innerJoin(subjects, eq(exams.subjectId, subjects.id))
    .where(eq(examResults.studentId, studentId));

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/** Exam history with absences excluded — a missed exam isn't a performance
 * data point, so every progress/trend/topic calculation should use this
 * rather than the raw history. */
function excludeAbsent(history: ExamHistoryPoint[]): ExamHistoryPoint[] {
  return history.filter((h) => !h.absent);
}

export function computeProgressStats(
  historyIncludingAbsences: ExamHistoryPoint[],
): ProgressStats {
  const history = excludeAbsent(historyIncludingAbsences);
  if (!history.length) {
    return { numExams: 0, average: 0, best: 0, lowest: 0, improvement: 0, trend: 0 };
  }
  const percentages = history.map((h) => h.percentage);
  return {
    numExams: history.length,
    average: average(percentages),
    best: Math.max(...percentages),
    lowest: Math.min(...percentages),
    improvement: round1(percentages[percentages.length - 1] - percentages[0]),
    trend: trendDelta(percentages),
  };
}

export async function getStudentTopicPerformance(
  studentId: string,
): Promise<TopicPerformance[]> {
  const history = excludeAbsent(await getStudentExamHistory(studentId));
  if (!history.length) return [];
  const resultIds = history.map((h) => h.examResultId);

  const rows = await db
    .select({
      examResultId: topicResults.examResultId,
      score: topicResults.score,
      maxPoints: examTopics.maxPoints,
      topicId: topics.id,
      topicName: topics.name,
    })
    .from(topicResults)
    .innerJoin(examTopics, eq(topicResults.examTopicId, examTopics.id))
    .innerJoin(topics, eq(examTopics.topicId, topics.id))
    .where(inArray(topicResults.examResultId, resultIds));

  const dateByResultId = new Map(history.map((h) => [h.examResultId, h.date]));

  const byTopic = new Map<
    string,
    { name: string; series: { date: string; pct: number }[] }
  >();

  for (const row of rows) {
    const date = dateByResultId.get(row.examResultId) ?? "";
    const p = pct(row.score, row.maxPoints);
    const entry = byTopic.get(row.topicId) ?? {
      name: row.topicName,
      series: [],
    };
    entry.series.push({ date, pct: p });
    byTopic.set(row.topicId, entry);
  }

  const result: TopicPerformance[] = [];
  for (const [topicId, { name, series }] of byTopic) {
    series.sort((a, b) => a.date.localeCompare(b.date));
    const pcts = series.map((s) => s.pct);
    result.push({
      topicId,
      name,
      attempts: series.length,
      averagePct: average(pcts),
      status: topicStatus(average(pcts)),
      trend: trendDelta(pcts),
      series,
    });
  }

  return result.sort((a, b) => b.averagePct - a.averagePct);
}

export type MonthAttendance = {
  month: string; // YYYY-MM
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
};

export type AttendanceSummary = {
  months: MonthAttendance[];
  totals: MonthAttendance;
};

export async function getStudentAttendance(
  studentId: string,
): Promise<AttendanceSummary> {
  const rows = await db
    .select({
      status: attendance.status,
      date: lessons.date,
    })
    .from(attendance)
    .innerJoin(lessons, eq(attendance.lessonId, lessons.id))
    .where(eq(attendance.studentId, studentId));

  const byMonth = new Map<string, MonthAttendance>();
  const blank = (month: string): MonthAttendance => ({
    month,
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    rate: 0,
  });

  for (const row of rows) {
    const month = row.date.slice(0, 7);
    const m = byMonth.get(month) ?? blank(month);
    m.total += 1;
    if (row.status === "PRESENT") m.present += 1;
    else if (row.status === "ABSENT") m.absent += 1;
    else if (row.status === "LATE") m.late += 1;
    else if (row.status === "EXCUSED") m.excused += 1;
    byMonth.set(month, m);
  }

  const months = [...byMonth.values()]
    .map((m) => ({
      ...m,
      rate: m.total ? round1(((m.present + m.late) / m.total) * 100) : 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totals = months.reduce((acc, m) => {
    acc.total += m.total;
    acc.present += m.present;
    acc.absent += m.absent;
    acc.late += m.late;
    acc.excused += m.excused;
    return acc;
  }, blank("total"));
  totals.rate = totals.total
    ? round1(((totals.present + totals.late) / totals.total) * 100)
    : 100;

  return { months, totals };
}
