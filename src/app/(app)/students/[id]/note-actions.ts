"use server";

import { addTeacherNote } from "@/lib/actions";

export async function addNoteAction(studentId: string, note: string) {
  if (!note.trim()) return;
  await addTeacherNote(studentId, note.trim());
}
