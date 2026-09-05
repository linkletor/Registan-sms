"use client";

import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";

type Group = { id: string; name: string; grade: number };

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </Card>
  );
}

export default function StudentForm({
  groups,
  initial,
  cancelHref,
  action,
}: {
  groups: Group[];
  action: (formData: FormData) => void | Promise<void>;
  initial?: Partial<{
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    fatherName: string | null;
    dob: string | null;
    gender: string | null;
    groupId: string | null;
    academicLevel: string | null;
    previousLevel: string | null;
    enrollmentDate: string;
    status: string;
    region: string | null;
    district: string | null;
    address: string | null;
    addressExtra: string | null;
    notes: string | null;
    fatherPhone: string | null;
    motherName: string | null;
    motherPhone: string | null;
    parentEmail: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  }>;
  cancelHref: string;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-5">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <Section title="Basic information">
        <Field label="Student ID" name="studentCode" defaultValue={initial?.studentCode} required />
        <Field label="First name" name="firstName" defaultValue={initial?.firstName} required />
        <Field label="Last name" name="lastName" defaultValue={initial?.lastName} required />
        <Field label="Father's name" name="fatherName" defaultValue={initial?.fatherName} />
        <Field label="Date of birth" name="dob" type="date" defaultValue={initial?.dob} />
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Gender</span>
          <select
            name="gender"
            defaultValue={initial?.gender ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">—</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Group <span className="text-rose-500">*</span>
          </span>
          <select
            name="groupId"
            required
            defaultValue={initial?.groupId ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="" disabled>
              Select group…
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                Grade {g.grade} — {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Academic level</span>
          <select
            name="academicLevel"
            defaultValue={initial?.academicLevel ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">—</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Previous level</span>
          <select
            name="previousLevel"
            defaultValue={initial?.previousLevel ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">—</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </label>
        <Field
          label="Enrollment date"
          name="enrollmentDate"
          type="date"
          defaultValue={initial?.enrollmentDate ?? today}
          required
        />
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Status</span>
          <select
            name="status"
            defaultValue={initial?.status ?? "ACTIVE"}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
      </Section>

      <Section title="Parent / guardian information">
        <Field label="Father's phone" name="fatherPhone" defaultValue={initial?.fatherPhone} />
        <Field label="Mother's name" name="motherName" defaultValue={initial?.motherName} />
        <Field label="Mother's phone" name="motherPhone" defaultValue={initial?.motherPhone} />
        <Field label="Parent email" name="parentEmail" type="email" defaultValue={initial?.parentEmail} />
        <Field
          label="Emergency contact name"
          name="emergencyContactName"
          defaultValue={initial?.emergencyContactName}
        />
        <Field
          label="Emergency contact phone"
          name="emergencyContactPhone"
          defaultValue={initial?.emergencyContactPhone}
        />
      </Section>

      <Section title="Location">
        <Field label="Region" name="region" defaultValue={initial?.region ?? "Fergana"} />
        <Field label="District" name="district" defaultValue={initial?.district} />
        <Field label="Address" name="address" defaultValue={initial?.address} />
        <Field label="Additional info" name="addressExtra" defaultValue={initial?.addressExtra} />
      </Section>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Notes</h3>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          placeholder="General notes about this student…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </Card>

      <div className="flex justify-end gap-2">
        <SecondaryButton href={cancelHref}>Cancel</SecondaryButton>
        <PrimaryButton type="submit">Save student</PrimaryButton>
      </div>
    </form>
  );
}
