// ---------------------------------------------------------------------------
// Shared calculation helpers: percentages, topic-strength labels, trend
// detection, attendance rates. Kept pure/framework-free so they're easy to
// unit-test and reuse across pages, server actions, and reports.
// ---------------------------------------------------------------------------

export function pct(score: number, max: number): number {
  if (!max) return 0;
  return Math.round((score / max) * 1000) / 10; // one decimal place
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type TopicStatus = "Strong" | "Good" | "Needs improvement" | "Weak";

export function topicStatus(averagePct: number): TopicStatus {
  if (averagePct >= 85) return "Strong";
  if (averagePct >= 70) return "Good";
  if (averagePct >= 55) return "Needs improvement";
  return "Weak";
}

export const TOPIC_STATUS_COLOR: Record<TopicStatus, string> = {
  Strong: "text-emerald-700 bg-emerald-50 ring-emerald-600/20",
  Good: "text-sky-700 bg-sky-50 ring-sky-600/20",
  "Needs improvement": "text-amber-700 bg-amber-50 ring-amber-600/20",
  Weak: "text-rose-700 bg-rose-50 ring-rose-600/20",
};

export function heatColor(averagePct: number): string {
  if (averagePct >= 85) return "bg-emerald-500";
  if (averagePct >= 70) return "bg-emerald-300";
  if (averagePct >= 55) return "bg-amber-300";
  if (averagePct >= 40) return "bg-orange-400";
  return "bg-rose-500";
}

/** Simple trend: compares the average of the first half vs second half of a
 * chronological series of percentages. Returns the delta (later - earlier). */
export function trendDelta(seriesAsc: number[]): number {
  if (seriesAsc.length < 2) return 0;
  const mid = Math.ceil(seriesAsc.length / 2);
  const first = seriesAsc.slice(0, mid);
  const second = seriesAsc.slice(mid);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return round1(avg(second) - avg(first));
}

export function average(nums: number[]): number {
  if (!nums.length) return 0;
  return round1(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function attendanceRate(
  present: number,
  late: number,
  total: number,
): number {
  if (!total) return 100;
  return round1(((present + late) / total) * 100);
}

export const ATTENDANCE_LABEL: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

export const ATTENDANCE_COLOR: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-800",
  ABSENT: "bg-rose-100 text-rose-800",
  LATE: "bg-amber-100 text-amber-800",
  EXCUSED: "bg-sky-100 text-sky-800",
};
