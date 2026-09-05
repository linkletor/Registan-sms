"use client";

import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { submitNewGroup } from "./actions";

export default function NewGroupForm({ tutors }: { tutors: { id: string; name: string }[] }) {
  return (
    <Card>
      <form action={submitNewGroup} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Group name</span>
          <input
            name="name"
            required
            placeholder="Group A"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Grade</span>
          <input
            name="grade"
            type="number"
            required
            min={1}
            max={12}
            placeholder="10"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Tutor</span>
          <select
            name="tutorId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="" disabled>
              Select tutor…
            </option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Academic year</span>
          <input
            name="academicYear"
            required
            defaultValue="2026-2027"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <SecondaryButton href="/groups">Cancel</SecondaryButton>
          <PrimaryButton type="submit">Create group</PrimaryButton>
        </div>
      </form>
    </Card>
  );
}
