import type { StudentFormInput } from "@/lib/actions";

export function parseStudentFormData(formData: FormData): StudentFormInput {
  return {
    id: (formData.get("id") as string) || undefined,
    studentCode: String(formData.get("studentCode") || ""),
    firstName: String(formData.get("firstName") || ""),
    lastName: String(formData.get("lastName") || ""),
    fatherName: String(formData.get("fatherName") || ""),
    dob: String(formData.get("dob") || ""),
    gender: (formData.get("gender") as "MALE" | "FEMALE" | "") || "",
    groupId: String(formData.get("groupId") || ""),
    academicLevel: String(formData.get("academicLevel") || ""),
    previousLevel: String(formData.get("previousLevel") || ""),
    enrollmentDate: String(formData.get("enrollmentDate") || ""),
    status: (formData.get("status") as "ACTIVE" | "INACTIVE") || "ACTIVE",
    region: String(formData.get("region") || ""),
    district: String(formData.get("district") || ""),
    address: String(formData.get("address") || ""),
    addressExtra: String(formData.get("addressExtra") || ""),
    notes: String(formData.get("notes") || ""),
    fatherPhone: String(formData.get("fatherPhone") || ""),
    motherName: String(formData.get("motherName") || ""),
    motherPhone: String(formData.get("motherPhone") || ""),
    parentEmail: String(formData.get("parentEmail") || ""),
    emergencyContactName: String(formData.get("emergencyContactName") || ""),
    emergencyContactPhone: String(formData.get("emergencyContactPhone") || ""),
  };
}
