"use server";

import { createExam } from "@/lib/actions";
import { redirect } from "next/navigation";

export async function submitNewExam(formData: FormData) {
  const names = formData.getAll("topicName").map(String);
  const maxes = formData.getAll("topicMax").map((v) => Number(v));

  const topicList = names
    .map((name, i) => ({ name: name.trim(), maxPoints: maxes[i] || 0 }))
    .filter((t) => t.name && t.maxPoints > 0);

  if (!topicList.length) {
    throw new Error("Add at least one topic with a max point value.");
  }

  const { id } = await createExam({
    name: String(formData.get("name") || ""),
    subjectName: String(formData.get("subjectName") || "Mathematics"),
    groupId: String(formData.get("groupId") || ""),
    date: String(formData.get("date") || ""),
    topicList,
  });

  redirect(`/exams/${id}`);
}
