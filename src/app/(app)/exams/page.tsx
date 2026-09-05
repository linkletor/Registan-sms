import { requireUser } from "@/lib/session";
import { listExams } from "@/lib/data/exams";
import { Card, PageHeader, PrimaryButton, EmptyState } from "@/components/ui";
import Link from "next/link";
import { format } from "date-fns";

export default async function ExamsPage() {
  const user = await requireUser();
  const exams = await listExams(user);

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle={`${exams.length} exam${exams.length === 1 ? "" : "s"} recorded`}
        action={<PrimaryButton href="/exams/new">+ Create Exam</PrimaryButton>}
      />

      <Card padding={false}>
        {exams.length === 0 ? (
          <div className="p-6">
            <EmptyState text="No exams yet. Create your first one." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Exam</th>
                  <th className="px-5 py-2.5 font-medium">Subject</th>
                  <th className="px-5 py-2.5 font-medium">Group</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium text-right">Max Score</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/exams/${e.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                        {e.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{e.subjectName}</td>
                    <td className="px-5 py-3 text-slate-600">
                      Grade {e.groupGrade} — {e.groupName}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{format(new Date(e.date), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{e.maxScore}</td>
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
