"use client";

import { PrimaryButton } from "@/components/ui";
import { submitNewTutor } from "./actions";

export default function AddTutorForm() {
  return (
    <form action={submitNewTutor} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Full name</span>
        <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Email</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Temporary password</span>
        <input
          name="password"
          type="text"
          required
          minLength={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Phone</span>
        <input name="phone" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
      </label>
      <div className="sm:col-span-2">
        <PrimaryButton type="submit">Create tutor account</PrimaryButton>
      </div>
    </form>
  );
}
