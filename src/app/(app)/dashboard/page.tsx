import { requireUser } from "@/lib/session";
import { getDashboardOverview, getRecentExams, getStudentsNeedingAttention } from "@/lib/data/dashboard";
import { listGroups } from "@/lib/data/groups";
import { Card, PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import GroupBarChart from "@/components/charts/GroupBarChart";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const user = await requireUser();
  const [overview, recentExams, attention, groups] = await Promise.all([
    getDashboardOverview(user),
    getRecentExams(user),
    getStudentsNeedingAttention(user),
    listGroups(user),
  ]);

  const groupChartData = groups
    .filter((g) => g.averageScore !== null)
    .map((g) => ({ name: `Gr.${g.grade} ${g.name}`, average: g.averageScore as number }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A snapshot of every student and group you can see, updated live."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Students" value={overview.totalStudents} />
        <StatCard
          label="Average Score"
          value={overview.averageScore !== null ? `${overview.averageScore}%` : "—"}
        />
        <StatCard
          label="Average Attendance"
          value={overview.averageAttendance !== null ? `${overview.averageAttendance}%` : "—"}
        />
        <StatCard label="Improving" value={overview.improving} tone="good" />
        <StatCard label="Declining" value={overview.declining} tone="bad" />
        <StatCard label="At Risk" value={overview.atRisk} tone="warn" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">Group Comparison</h2>
          <p className="mb-4 text-xs text-slate-500">Average exam score by group</p>
          {groupChartData.length ? (
            <GroupBarChart data={groupChartData} />
          ) : (
            <EmptyState text="No exam results yet." />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Students Needing Attention
          </h2>
          {attention.length === 0 ? (
            <EmptyState text="No students flagged right now." />
          ) : (
            <ul className="space-y-3">
              {attention.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link href={`/students/${s.id}`} className="block rounded-lg p-2 -m-2 transition hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{s.name}</span>
                      <span className="text-xs text-slate-400">{s.groupName}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-amber-700">
                      ⚠️ {s.reasons[0].detail}
                      {s.reasons.length > 1 ? ` (+${s.reasons.length - 1} more)` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {attention.length > 6 && (
            <p className="mt-3 text-xs text-slate-400">+{attention.length - 6} more students flagged</p>
          )}
        </Card>
      </div>

      <Card className="mt-6" padding={false}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Recent Exams</h2>
          <Link href="/exams" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View all →
          </Link>
        </div>
        {recentExams.length === 0 ? (
          <div className="p-5">
            <EmptyState text="No exams recorded yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Exam</th>
                  <th className="px-5 py-2.5 font-medium">Group</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium text-right">Average</th>
                  <th className="px-5 py-2.5 font-medium text-right">Highest</th>
                  <th className="px-5 py-2.5 font-medium text-right">Lowest</th>
                </tr>
              </thead>
              <tbody>
                {recentExams.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/exams/${e.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                        {e.name}
                      </Link>
                      <span className="ml-2 text-xs text-slate-400">{e.subjectName}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{e.groupName}</td>
                    <td className="px-5 py-3 text-slate-600">{format(new Date(e.date), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">
                      {e.average !== null ? `${e.average}%` : <Badge className="bg-slate-50 text-slate-500 ring-slate-200">No data</Badge>}
                    </td>
                    <td className="px-5 py-3 text-right text-emerald-600">{e.highest !== null ? `${e.highest}%` : "—"}</td>
                    <td className="px-5 py-3 text-right text-rose-600">{e.lowest !== null ? `${e.lowest}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
