"use server";

import { saveExamResults } from "@/lib/actions";

export type GridRow = {
  studentId: string;
  absent: boolean;
  scores: { examTopicId: string; score: number | null }[];
};

export async function saveResultsAction(examId: string, rows: GridRow[]) {
  await saveExamResults(examId, rows);
}
