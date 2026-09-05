"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveResultsAction } from "./actions";
import { PrimaryButton } from "@/components/ui";

type ExamTopic = { id: string; name: string; maxPoints: number };
type RosterEntry = {
  student: { id: string; firstName: string; lastName: string; studentCode: string };
  result: { absent: boolean } | null;
  scores: { examTopicId: string; score: number | null }[];
};

export default function ResultsGrid({
  examId,
  examTopics,
  roster,
}: {
  examId: string;
  examTopics: ExamTopic[];
  roster: RosterEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const maxScore = examTopics.reduce((a, t) => a + t.maxPoints, 0);

  const [rows, setRows] = useState(() =>
    roster.map((r) => ({
      studentId: r.student.id,
      name: `${r.student.lastName} ${r.student.firstName}`,
      studentCode: r.student.studentCode,
      absent: r.result?.absent ?? false,
      scores: Object.fromEntries(r.scores.map((s) => [s.examTopicId, s.score])) as Record<
        string,
        number | null
      >,
    })),
  );

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  function cellKey(rowIdx: number, colIdx: number) {
    return `${rowIdx}-${colIdx}`;
  }

  function focusCell(rowIdx: number, colIdx: number) {
    const el = inputRefs.current.get(cellKey(rowIdx, colIdx));
    el?.focus();
    el?.select();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(Math.min(rowIdx + 1, rows.length - 1), colIdx);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusCell(Math.max(rowIdx - 1, 0), colIdx);
    } else if (e.key === "ArrowRight" && (e.target as HTMLInputElement).selectionEnd === (e.target as HTMLInputElement).value.length) {
      focusCell(rowIdx, Math.min(colIdx + 1, examTopics.length - 1));
    } else if (e.key === "ArrowLeft" && (e.target as HTMLInputElement).selectionStart === 0) {
      focusCell(rowIdx, Math.max(colIdx - 1, 0));
    }
  }

  function updateScore(rowIdx: number, topicId: string, value: string) {
    setRows((prev) => {
      const copy = [...prev];
      const num = value === "" ? null : Number(value);
      copy[rowIdx] = { ...copy[rowIdx], scores: { ...copy[rowIdx].scores, [topicId]: num } };
      return copy;
    });
  }

  function toggleAbsent(rowIdx: number) {
    setRows((prev) => {
      const copy = [...prev];
      copy[rowIdx] = { ...copy[rowIdx], absent: !copy[rowIdx].absent };
      return copy;
    });
  }

  const computed = useMemo(
    () =>
      rows.map((r) => {
        const total = r.absent
          ? 0
          : examTopics.reduce((a, t) => a + (r.scores[t.id] ?? 0), 0);
        const pct = maxScore && !r.absent ? Math.round((total / maxScore) * 1000) / 10 : 0;
        return { ...r, total, pct };
      }),
    [rows, examTopics, maxScore],
  );

  function handleSave() {
    startTransition(async () => {
      await saveResultsAction(
        examId,
        computed.map((r) => ({
          studentId: r.studentId,
          absent: r.absent,
          scores: examTopics.map((t) => ({ examTopicId: t.id, score: r.absent ? 0 : r.scores[t.id] ?? null })),
        })),
      );
      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Tip: use <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono">Enter</kbd> or the arrow keys to move
          between cells, just like a spreadsheet.
        </p>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs text-emerald-600">Saved at {savedAt}</span>}
          <PrimaryButton onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save results"}
          </PrimaryButton>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 font-medium">Student</th>
              {examTopics.map((t) => (
                <th key={t.id} className="px-3 py-2.5 text-center font-medium">
                  {t.name}
                  <div className="text-[10px] font-normal normal-case text-slate-400">max {t.maxPoints}</div>
                </th>
              ))}
              <th className="px-3 py-2.5 text-center font-medium">Absent</th>
              <th className="px-3 py-2.5 text-right font-medium">Total</th>
              <th className="px-3 py-2.5 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {computed.map((r, rowIdx) => (
              <tr key={r.studentId} className={`border-b border-slate-100 last:border-0 ${r.absent ? "bg-slate-50 opacity-60" : ""}`}>
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-1.5 font-medium text-slate-800">
                  {r.name}
                  <span className="ml-2 text-xs font-normal text-slate-400">{r.studentCode}</span>
                </td>
                {examTopics.map((t, colIdx) => (
                  <td key={t.id} className="px-2 py-1.5">
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(cellKey(rowIdx, colIdx), el);
                      }}
                      type="number"
                      min={0}
                      max={t.maxPoints}
                      step={0.5}
                      disabled={r.absent}
                      value={r.scores[t.id] ?? ""}
                      onChange={(e) => updateScore(rowIdx, t.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                      onFocus={(e) => e.target.select()}
                      className="w-16 rounded-md border border-slate-200 px-2 py-1 text-center text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-100"
                    />
                  </td>
                ))}
                <td className="px-3 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={r.absent}
                    onChange={() => toggleAbsent(rowIdx)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                </td>
                <td className="px-3 py-1.5 text-right font-medium text-slate-800">
                  {r.absent ? "—" : `${r.total}/${maxScore}`}
                </td>
                <td className="px-3 py-1.5 text-right font-semibold text-slate-900">{r.absent ? "—" : `${r.pct}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
