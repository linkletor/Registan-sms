import { requireUser } from "@/lib/session";
import { listAllGroupsForForm } from "@/lib/data/students";
import { PageHeader } from "@/components/ui";
import ExamForm from "./ExamForm";

export default async function NewExamPage() {
  const user = await requireUser();
  const groups = await listAllGroupsForForm(user);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create Exam" subtitle="Define topics and max points — you'll enter scores next." />
      <ExamForm groups={groups} />
    </div>
  );
}
