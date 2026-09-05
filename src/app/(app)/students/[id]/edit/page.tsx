import { requireUser } from "@/lib/session";
import { getStudentById, listAllGroupsForForm } from "@/lib/data/students";
import { PageHeader } from "@/components/ui";
import StudentForm from "@/components/StudentForm";
import { notFound } from "next/navigation";
import { submitEditStudent } from "./actions";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [row, groups] = await Promise.all([getStudentById(id, user), listAllGroupsForForm(user)]);
  if (!row) notFound();

  const { student, parent } = row;

  return (
    <div>
      <PageHeader title={`Edit ${student.firstName} ${student.lastName}`} subtitle={student.studentCode} />
      <StudentForm
        groups={groups}
        cancelHref={`/students/${id}`}
        action={submitEditStudent}
        initial={{
          id: student.id,
          studentCode: student.studentCode,
          firstName: student.firstName,
          lastName: student.lastName,
          fatherName: student.fatherName,
          dob: student.dob,
          gender: student.gender,
          groupId: student.groupId,
          academicLevel: student.academicLevel,
          previousLevel: student.previousLevel,
          enrollmentDate: student.enrollmentDate,
          status: student.status,
          region: student.region,
          district: student.district,
          address: student.address,
          addressExtra: student.addressExtra,
          notes: student.notes,
          fatherPhone: parent?.fatherPhone,
          motherName: parent?.motherName,
          motherPhone: parent?.motherPhone,
          parentEmail: parent?.parentEmail,
          emergencyContactName: parent?.emergencyContactName,
          emergencyContactPhone: parent?.emergencyContactPhone,
        }}
      />
    </div>
  );
}
