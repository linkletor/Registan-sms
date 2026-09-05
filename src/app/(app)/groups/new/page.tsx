import { requireAdmin } from "@/lib/session";
import { listTutors } from "@/lib/data/users";
import { PageHeader } from "@/components/ui";
import NewGroupForm from "./NewGroupForm";

export default async function NewGroupPage() {
  await requireAdmin();
  const tutors = await listTutors();

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="New Group" subtitle="Create a class group, e.g. Grade 10 — Group A." />
      <NewGroupForm tutors={tutors} />
    </div>
  );
}
