import { requireUser } from "@/lib/session";
import { getExamDetail } from "@/lib/data/exams";
import { PageHeader, Card, StatCard, SecondaryButton } from "@/components/ui";
import ResultsGrid from "./ResultsGrid";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { average } from "@/lib/calc";

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const detail = await getExamDetail(id, user);
  if (!detail) notFound();

  const { exam, examTopics, roster } = detail;
  const submitted = roster.filter((r) => r.result !== null);
  const percentages = submitted.map((r) => r.result!.percentage);

  return (
    <div>
      <PageHeader
        title={exam.name}
        subtitle={`${exam.subjectName} · Grade ${exam.groupGrade} — ${exam.groupName} · ${format(new Date(exam.date), "MMMM d, yyyy")}`}
        action={<SecondaryButton href="/exams">← All exams</SecondaryButton>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Max Score" value={exam.maxScore} />
        <StatCard label="Submitted" value={`${submitted.length}/${roster.length}`} />
        <StatCard label="Class Average" value={percentages.length ? `${average(percentages)}%` : "—"} />
        <StatCard
          label="Highest / Lowest"
          value={percentages.length ? `${Math.max(...percentages)}% / ${Math.min(...percentages)}%` : "—"}
        />
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="p-5">
          <ResultsGrid examId={id} examTopics={examTopics} roster={roster} />
        </div>
      </Card>
    </div>
  );
}
