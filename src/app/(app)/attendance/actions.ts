"use server";

import { saveAttendance } from "@/lib/actions";

export type AttendanceEntry = { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" };

export async function saveAttendanceAction(
  groupId: string,
  date: string,
  topic: string | undefined,
  entries: AttendanceEntry[],
) {
  await saveAttendance(groupId, date, topic, entries);
}
