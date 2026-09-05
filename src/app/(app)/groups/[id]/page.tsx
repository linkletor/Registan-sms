import { requireUser } from "@/lib/session";
import { getGroupById, getGroupExamTrend, getGroupTopicPerformance } from "@/lib/data/groups";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui";
import ProgressLineChart from "@/components/charts/ProgressLineChart";
import TopicBarChart from "@/components/charts/TopicBarChart";
import Link from "next/link";
import { notFound } from "next/navigation";
import { average } from "@/lib/calc";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getGroupById(id, user);
  if (!data) notFound();
  const { group, roster } = data;

  const [trend, topicPerf] = await Promise.all([getGroupExamTrend(id), getGroupTopicPerformance(id)]);

  const averages = roster.map((s) => s.perf?.averageScore).filter((v): v is number => v !== null && v !== undefined);
  const rates = roster
    .map((s) => s.perf?.attendanceRatePct)
    .filter((v): v is number => v !== null && v !== undefined);

  return (
    <div>
      <PageHeader
        title={`Grade ${group.grade} — ${group.name}`}
        subtitle={`Tutor: ${group.tutorName} · ${group.academicYear}`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Students</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{roster.length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Avg. score</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {averages.length ? `${average(averages)}%` : "—"}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Attendance</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{rates.length ? `${average(rates)}%` : "—"}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Exams given</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{trend.length}</p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Group Average Progress</h3>
          {trend.length ? <ProgressLineChart data={trend} /> : <EmptyState text="No exams yet." />}
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Topic Performance (group average)</h3>
          {topicPerf.length ? (
            <TopicBarChart data={topicPerf.map((t) => ({ name: t.name, averagePct: t.averagePct }))} />
          ) : (
            <EmptyState text="No topic results yet." />
          )}
        </Card>
      </div>

      <Card className="mt-6" padding={false}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Roster</h3>
          <span className="text-xs text-slate-400">Sorted by last name</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-medium">Student</th>
                <th className="px-5 py-2.5 font-medium">ID</th>
                <th className="px-5 py-2.5 font-medium text-right">Avg. Score</th>
                <th className="px-5 py-2.5 font-medium text-right">Attendance</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/students/${s.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                      {s.firstName} {s.lastName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{s.studentCode}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-800">
                    {s.perf?.averageScore !== null && s.perf?.averageScore !== undefined ? `${s.perf.averageScore}%` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {s.perf?.attendanceRatePct !== null && s.perf?.attendanceRatePct !== undefined
                      ? `${s.perf.attendanceRatePct}%`
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      className={
                        s.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-500 ring-slate-300"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
