import { requireUser } from "@/lib/session";
import { listStudents } from "@/lib/data/students";
import { listGroups } from "@/lib/data/groups";
import { PageHeader, PrimaryButton, Badge, EmptyState } from "@/components/ui";
import Link from "next/link";

function trendBadge(trend: number) {
  if (trend >= 5) return <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">+{trend} pts</Badge>;
  if (trend <= -5) return <Badge className="bg-rose-50 text-rose-700 ring-rose-600/20">{trend} pts</Badge>;
  return <Badge className="bg-slate-50 text-slate-500 ring-slate-200">Stable</Badge>;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const [students, groups] = await Promise.all([
    listStudents(user, {
      q: params.q,
      groupId: params.groupId,
      grade: params.grade,
      status: params.status || "ACTIVE",
      performance: (params.performance as "below60" | "below40" | "") || "",
    }),
    listGroups(user),
  ]);

  const grades = [...new Set(groups.map((g) => g.grade))].sort((a, b) => a - b);

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${students.length} student${students.length === 1 ? "" : "s"} found`}
        action={<PrimaryButton href="/students/new">+ Add Student</PrimaryButton>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form action="/students" method="get" className="contents">
          <input
            type="text"
            name="q"
            defaultValue={params.q || ""}
            placeholder="Search name or student ID…"
            className="w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <select
            name="grade"
            defaultValue={params.grade || ""}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
          <select
            name="groupId"
            defaultValue={params.groupId || ""}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                Gr.{g.grade} {g.name}
              </option>
            ))}
          </select>
          <select
            name="performance"
            defaultValue={params.performance || ""}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All performance</option>
            <option value="below60">Average below 60%</option>
            <option value="below40">Average below 40%</option>
          </select>
          <select
            name="status"
            defaultValue={params.status || "ACTIVE"}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="">All statuses</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Apply
          </button>
          {(params.q || params.grade || params.groupId || params.performance) && (
            <Link href="/students" className="text-xs font-medium text-slate-500 hover:text-slate-700">
              Clear filters
            </Link>
          )}
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {students.length === 0 ? (
          <div className="p-6">
            <EmptyState text="No students match these filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Student</th>
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">Group</th>
                  <th className="px-4 py-2.5 font-medium">Tutor</th>
                  <th className="px-4 py-2.5 font-medium text-right">Avg. Score</th>
                  <th className="px-4 py-2.5 font-medium text-right">Attendance</th>
                  <th className="px-4 py-2.5 font-medium text-right">Trend</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/students/${s.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                        {s.firstName} {s.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.studentCode}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.groupName ? `Gr.${s.grade} ${s.groupName}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.tutorName ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {s.averageScore !== null ? `${s.averageScore}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {s.attendanceRatePct !== null ? `${s.attendanceRatePct}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">{trendBadge(s.trend)}</td>
                    <td className="px-4 py-3">
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
        )}
      </div>
    </div>
  );
}
