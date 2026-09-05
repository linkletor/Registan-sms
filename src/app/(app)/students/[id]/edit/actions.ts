"use server";

import { upsertStudent } from "@/lib/actions";
import { parseStudentFormData } from "@/lib/student-form-parse";
import { redirect } from "next/navigation";

export async function submitEditStudent(formData: FormData) {
  const input = parseStudentFormData(formData);
  const { id } = await upsertStudent(input);
  redirect(`/students/${id}`);
}
