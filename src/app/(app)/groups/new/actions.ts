"use server";

import { createGroup } from "@/lib/actions";
import { redirect } from "next/navigation";

export async function submitNewGroup(formData: FormData) {
  const { id } = await createGroup({
    name: String(formData.get("name") || ""),
    grade: Number(formData.get("grade") || 0),
    tutorId: String(formData.get("tutorId") || ""),
    academicYear: String(formData.get("academicYear") || ""),
  });
  redirect(`/groups/${id}`);
}
