"use client";

import { useActionState } from "react";
import { addNoteAction } from "./note-actions";

export default function NoteForm({ studentId }: { studentId: string }) {
  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await addNoteAction(studentId, String(formData.get("note") || ""));
    return null;
  }, null);

  return (
    <form action={formAction} className="mt-4 flex gap-2">
      <input
        name="note"
        required
        placeholder="Add a note about this student…"
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
