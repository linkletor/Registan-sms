"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAttendanceAction } from "./actions";
import { PrimaryButton } from "@/components/ui";
import clsx from "clsx";
import { ATTENDANCE_COLOR, ATTENDANCE_LABEL } from "@/lib/calc";

type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
const STATUSES: Status[] = ["PRESENT", "LATE", "EXCUSED", "ABSENT"];

export default function AttendanceGrid({
  groupId,
  date,
  roster,
  lessonTopic,
}: {
  groupId: string;
  date: string;
  roster: { student: { id: string; firstName: string; lastName: string; studentCode: string }; status: Status }[];
  lessonTopic: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [topic, setTopic] = useState(lessonTopic);
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    Object.fromEntries(roster.map((r) => [r.student.id, r.status])),
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: Object.values(statuses).filter((v) => v === s).length }),
    {} as Record<Status, number>,
  );

  function markAll(status: Status) {
    setStatuses(Object.fromEntries(roster.map((r) => [r.student.id, status])));
  }

  function handleSave() {
    startTransition(async () => {
      await saveAttendanceAction(
        groupId,
        date,
        topic,
        roster.map((r) => ({ studentId: r.student.id, status: statuses[r.student.id] })),
      );
      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Lesson topic (optional)"
            className="w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => markAll("PRESENT")}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Mark all present
          </button>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs text-emerald-600">Saved at {savedAt}</span>}
          <PrimaryButton onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save attendance"}
          </PrimaryButton>
        </div>
      </div>

      <div className="mb-4 flex gap-3 text-xs text-slate-500">
        {STATUSES.map((s) => (
          <span key={s} className={clsx("rounded-full px-2 py-0.5", ATTENDANCE_COLOR[s])}>
            {ATTENDANCE_LABEL[s]}: {counts[s]}
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-medium">Student</th>
              <th className="px-4 py-2.5 font-medium">ID</th>
              <th className="px-4 py-2.5 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.student.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-medium text-slate-800">
                  {r.student.lastName} {r.student.firstName}
                </td>
                <td className="px-4 py-2 text-slate-500">{r.student.studentCode}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatuses((prev) => ({ ...prev, [r.student.id]: s }))}
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition",
                          statuses[r.student.id] === s
                            ? ATTENDANCE_COLOR[s] + " ring-transparent"
                            : "bg-white text-slate-400 ring-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {ATTENDANCE_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
