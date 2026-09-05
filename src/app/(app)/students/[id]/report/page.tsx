import { requireUser } from "@/lib/session";
import { getStudentById } from "@/lib/data/students";
import {
  getStudentExamHistory,
  computeProgressStats,
  getStudentTopicPerformance,
  getStudentAttendance,
} from "@/lib/analytics";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import PrintButton from "./PrintButton";
import { SecondaryButton } from "@/components/ui";

export default async function StudentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const row = await getStudentById(id, user);
  if (!row) notFound();
  const { student, group } = row;

  const [history, topics, attendance] = await Promise.all([
    getStudentExamHistory(id),
    getStudentTopicPerformance(id),
    getStudentAttendance(id),
  ]);
  const stats = computeProgressStats(history);
  const strongest = topics.slice(0, 2).map((t) => t.name);
  const weakest = [...topics].sort((a, b) => a.averagePct - b.averagePct).slice(0, 2).map((t) => t.name);

  const periodStart = history[0]?.date;
  const periodEnd = history[history.length - 1]?.date;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex justify-end gap-2">
        <SecondaryButton href={`/students/${id}`}>Back to profile</SecondaryButton>
        <PrintButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-10 shadow-sm print:border-0 print:shadow-none">
        <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Registan Private School</h1>
            <p className="text-sm text-slate-500">Student Progress Report</p>
          </div>
          <p className="text-xs text-slate-400">Generated {format(new Date(), "MMMM d, yyyy")}</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Student</p>
            <p className="font-medium text-slate-900">
              {student.firstName} {student.lastName} ({student.studentCode})
            </p>
          </div>
          <div>
            <p className="text-slate-500">Group</p>
            <p className="font-medium text-slate-900">{group ? `Grade ${group.grade} — ${group.name}` : "—"}</p>
          </div>
          <div>
            <p className="text-slate-500">Period</p>
            <p className="font-medium text-slate-900">
              {periodStart && periodEnd
                ? `${format(new Date(periodStart), "MMM yyyy")} – ${format(new Date(periodEnd), "MMM yyyy")}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Exams taken</p>
            <p className="font-medium text-slate-900">{stats.numExams}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4 text-center">
          <SummaryBox label="Average score" value={`${stats.average}%`} />
          <SummaryBox label="Progress" value={`${stats.improvement > 0 ? "+" : ""}${stats.improvement} pts`} />
          <SummaryBox label="Best score" value={`${stats.best}%`} />
          <SummaryBox label="Attendance" value={`${attendance.totals.rate}%`} />
        </div>

        <Section title="Exam History">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-1.5">Exam</th>
                <th className="py-1.5">Date</th>
                <th className="py-1.5 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.examResultId} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5">{h.name}</td>
                  <td className="py-1.5 text-slate-500">{format(new Date(h.date), "MMM d, yyyy")}</td>
                  <td className="py-1.5 text-right font-medium">{h.absent ? "Absent" : `${h.percentage}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Topic Performance">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-1.5">Topic</th>
                <th className="py-1.5 text-right">Average</th>
                <th className="py-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.topicId} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5">{t.name}</td>
                  <td className="py-1.5 text-right font-medium">{t.averagePct}%</td>
                  <td className="py-1.5">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 font-semibold text-slate-800">Strongest topics</p>
            <p className="text-slate-600">{strongest.join(", ") || "—"}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-slate-800">Weakest topics</p>
            <p className="text-slate-600">{weakest.join(", ") || "—"}</p>
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          This report was generated automatically by the Registan SMS. Talk to your tutor for a detailed
          discussion of these results.
        </p>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 py-3">
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-2 text-sm font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}
