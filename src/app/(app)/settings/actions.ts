"use server";

import { createTutor } from "@/lib/actions";

export async function submitNewTutor(formData: FormData) {
  await createTutor({
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    phone: String(formData.get("phone") || ""),
  });
}
