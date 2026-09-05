import { requireUser } from "@/lib/session";
import { listAllGroupsForForm } from "@/lib/data/students";
import { getAttendanceSheet } from "@/lib/data/attendance";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import AttendanceGrid from "./AttendanceGrid";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string; date?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const groups = await listAllGroupsForForm(user);

  const groupId = params.groupId || groups[0]?.id || "";
  const date = params.date || new Date().toISOString().slice(0, 10);

  const sheet = groupId ? await getAttendanceSheet(groupId, date, user) : null;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Select a date and group, then mark everyone in a few seconds." />

      <Card className="mb-6">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Group</span>
            <select name="groupId" defaultValue={groupId} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  Grade {g.grade} — {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Date</span>
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </label>
          <button type="submit" className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            Load
          </button>
        </form>
      </Card>

      <Card>
        {!sheet ? (
          <EmptyState text="No groups available." />
        ) : (
          <AttendanceGrid
            groupId={groupId}
            date={date}
            lessonTopic={sheet.lesson?.topic || ""}
            roster={sheet.roster.map((r) => ({
              student: r.student,
              status: r.status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
            }))}
          />
        )}
      </Card>
    </div>
  );
}
