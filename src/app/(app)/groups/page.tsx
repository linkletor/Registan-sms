import { requireUser } from "@/lib/session";
import { listGroups } from "@/lib/data/groups";
import { Card, PageHeader, PrimaryButton, EmptyState } from "@/components/ui";
import Link from "next/link";

export default async function GroupsPage() {
  const user = await requireUser();
  const groups = await listGroups(user);

  return (
    <div>
      <PageHeader
        title="Groups"
        subtitle={`${groups.length} group${groups.length === 1 ? "" : "s"}`}
        action={user.role === "ADMIN" ? <PrimaryButton href="/groups/new">+ New Group</PrimaryButton> : undefined}
      />

      {groups.length === 0 ? (
        <EmptyState text="No groups yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link key={g.id} href={`/groups/${g.id}`}>
              <Card className="h-full transition hover:border-indigo-300 hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Grade {g.grade}</p>
                <h3 className="mt-0.5 text-base font-semibold text-slate-900">{g.name}</h3>
                <p className="mt-1 text-xs text-slate-400">Tutor: {g.tutorName}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-slate-800">{g.studentCount}</p>
                    <p className="text-[11px] text-slate-500">Students</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-800">
                      {g.averageScore !== null ? `${g.averageScore}%` : "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">Avg. score</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-800">
                      {g.attendanceRate !== null ? `${g.attendanceRate}%` : "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">Attendance</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
