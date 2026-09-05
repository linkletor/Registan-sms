import { requireUser } from "@/lib/session";
import { listAllGroupsForForm } from "@/lib/data/students";
import { PageHeader } from "@/components/ui";
import StudentForm from "@/components/StudentForm";
import { submitNewStudent } from "./actions";

export default async function NewStudentPage() {
  const user = await requireUser();
  const groups = await listAllGroupsForForm(user);

  return (
    <div>
      <PageHeader title="Add Student" subtitle="Create a new student profile." />
      <StudentForm groups={groups} cancelHref="/students" action={submitNewStudent} />
    </div>
  );
}
