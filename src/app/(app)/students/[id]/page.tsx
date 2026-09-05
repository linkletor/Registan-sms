import { requireUser } from "@/lib/session";
import { getStudentById, getTeacherNotes } from "@/lib/data/students";
import {
  getStudentExamHistory,
  computeProgressStats,
  getStudentTopicPerformance,
  getStudentAttendance,
} from "@/lib/analytics";
import { Card, PageHeader, Badge, SecondaryButton, PrimaryButton, EmptyState } from "@/components/ui";
import { TOPIC_STATUS_COLOR } from "@/lib/calc";
import ProgressLineChart from "@/components/charts/ProgressLineChart";
import TopicBarChart from "@/components/charts/TopicBarChart";
import AttendanceChart from "@/components/charts/AttendanceChart";
import NoteForm from "./NoteForm";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const row = await getStudentById(id, user);
  if (!row) notFound();

  const { student, group, tutor, parent } = row;

  const [history, topics, attendance, notes] = await Promise.all([
    getStudentExamHistory(id),
    getStudentTopicPerformance(id),
    getStudentAttendance(id),
    getTeacherNotes(id),
  ]);

  const stats = computeProgressStats(history);
  const strongest = topics.slice(0, 3);
  const weakest = [...topics].sort((a, b) => a.averagePct - b.averagePct).slice(0, 3);
  const improving = topics.filter((t) => t.trend >= 8);
  const declining = topics.filter((t) => t.trend <= -8);

  return (
    <div>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        subtitle={`${student.studentCode} · ${group ? `Grade ${group.grade} — ${group.name}` : "No group"}`}
        action={
          <div className="flex gap-2">
            <SecondaryButton href={`/students/${id}/report`}>Printable report</SecondaryButton>
            <PrimaryButton href={`/students/${id}/edit`}>Edit profile</PrimaryButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Student Information</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Father" value={student.fatherName} />
              <Row label="Date of birth" value={student.dob} />
              <Row label="Gender" value={student.gender === "MALE" ? "Male" : student.gender === "FEMALE" ? "Female" : null} />
              <Row label="Grade / Group" value={group ? `Grade ${group.grade} — ${group.name}` : null} />
              <Row label="Tutor" value={tutor?.name} />
              <Row label="Academic level" value={student.academicLevel} />
              <Row label="Previous level" value={student.previousLevel} />
              <Row label="Enrolled" value={student.enrollmentDate} />
              <Row
                label="Status"
                value={
                  <Badge
                    className={
                      student.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-slate-100 text-slate-500 ring-slate-300"
                    }
                  >
                    {student.status}
                  </Badge>
                }
              />
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Parent Information</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Father" value={parent?.fatherName} />
              <Row label="Father's phone" value={parent?.fatherPhone} />
              <Row label="Mother" value={parent?.motherName} />
              <Row label="Mother's phone" value={parent?.motherPhone} />
              <Row label="Email" value={parent?.parentEmail} />
              <Row label="Emergency contact" value={parent?.emergencyContactName} />
              <Row label="Emergency phone" value={parent?.emergencyContactPhone} />
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Location</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Region" value={student.region} />
              <Row label="District" value={student.district} />
              <Row label="Address" value={student.address} />
            </dl>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat label="Current avg." value={stats.average ? `${stats.average}%` : "—"} />
            <MiniStat label="Best score" value={stats.best ? `${stats.best}%` : "—"} />
            <MiniStat
              label="Improvement"
              value={stats.improvement !== 0 ? `${stats.improvement > 0 ? "+" : ""}${stats.improvement} pts` : "—"}
              tone={stats.improvement > 0 ? "good" : stats.improvement < 0 ? "bad" : "default"}
            />
            <MiniStat label="Attendance" value={`${attendance.totals.rate}%`} />
          </div>

          <Card>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Progress Chart</h3>
              <span className="text-xs text-slate-400">{stats.numExams} exam{stats.numExams === 1 ? "" : "s"} taken</span>
            </div>
            {history.some((h) => !h.absent) ? (
              <ProgressLineChart
                data={history
                  .filter((h) => !h.absent)
                  .map((h) => ({ label: format(new Date(h.date), "MMM d"), percentage: h.percentage }))}
              />
            ) : (
              <EmptyState text="No exam results recorded yet." />
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Exam History</h3>
            {history.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 font-medium">Exam</th>
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium text-right">Score</th>
                    <th className="py-2 font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((h) => (
                    <tr key={h.examResultId} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 font-medium text-slate-700">{h.name}</td>
                      <td className="py-2 text-slate-500">{format(new Date(h.date), "MMM d, yyyy")}</td>
                      {h.absent ? (
                        <td colSpan={2} className="py-2 text-right">
                          <Badge className="bg-slate-100 text-slate-500 ring-slate-300">Absent</Badge>
                        </td>
                      ) : (
                        <>
                          <td className="py-2 text-right text-slate-600">
                            {h.totalScore}/{h.maxScore}
                          </td>
                          <td className="py-2 text-right font-medium text-slate-800">{h.percentage}%</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState text="No exams yet." />
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Topic Performance</h3>
            {topics.length ? (
              <>
                <TopicBarChart data={topics.map((t) => ({ name: t.name, averagePct: t.averagePct }))} />
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TopicList title="Strongest topics" items={strongest} />
                  <TopicList title="Weakest topics" items={weakest} />
                  {improving.length > 0 && <TopicList title="Improving" items={improving} showTrend />}
                  {declining.length > 0 && <TopicList title="Declining" items={declining} showTrend />}
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-2 font-medium">Topic</th>
                        <th className="py-2 font-medium text-right">Average</th>
                        <th className="py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topics.map((t) => (
                        <tr key={t.topicId} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 text-slate-700">{t.name}</td>
                          <td className="py-2 text-right font-medium text-slate-800">{t.averagePct}%</td>
                          <td className="py-2">
                            <Badge className={TOPIC_STATUS_COLOR[t.status]}>{t.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EmptyState text="No topic-level results yet." />
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Attendance</h3>
            {attendance.months.length ? (
              <>
                <AttendanceChart data={attendance.months.map((m) => ({ month: m.month, rate: m.rate }))} />
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 text-center text-xs">
                  <MiniAttendance label="Total lessons" value={attendance.totals.total} />
                  <MiniAttendance label="Present" value={attendance.totals.present} tone="good" />
                  <MiniAttendance label="Absent" value={attendance.totals.absent} tone="bad" />
                  <MiniAttendance label="Late" value={attendance.totals.late} tone="warn" />
                  <MiniAttendance label="Rate" value={`${attendance.totals.rate}%`} />
                </div>
              </>
            ) : (
              <EmptyState text="No attendance recorded yet." />
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-800">Teacher Notes</h3>
            {notes.length ? (
              <ul className="mt-4 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="text-slate-700">{n.note}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {n.authorName ?? "Unknown"} · {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No notes yet.</p>
            )}
            <NoteForm studentId={id} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value ?? "—"}</dd>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
}) {
  const toneClass = { default: "text-slate-900", good: "text-emerald-600", bad: "text-rose-600" }[tone];
  return (
    <Card className="text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function MiniAttendance({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "bad" | "warn";
}) {
  const toneClass = {
    default: "text-slate-800",
    good: "text-emerald-600",
    bad: "text-rose-600",
    warn: "text-amber-600",
  }[tone];
  return (
    <div className="rounded-lg bg-slate-50 py-2">
      <p className={`text-base font-semibold ${toneClass}`}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function TopicList({
  title,
  items,
  showTrend,
}: {
  title: string;
  items: { name: string; averagePct: number; trend: number }[];
  showTrend?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t.name} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">{t.name}</span>
            <span className="font-medium text-slate-800">
              {showTrend ? `${t.trend > 0 ? "+" : ""}${t.trend} pts` : `${t.averagePct}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
