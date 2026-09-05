"use client";

import { useState } from "react";
import { submitNewExam } from "./actions";
import { PrimaryButton, SecondaryButton, Card } from "@/components/ui";

type Group = { id: string; name: string; grade: number };

export default function ExamForm({ groups }: { groups: Group[] }) {
  const [topics, setTopics] = useState([
    { name: "", max: 10 },
    { name: "", max: 10 },
  ]);

  const total = topics.reduce((a, t) => a + (Number(t.max) || 0), 0);

  return (
    <form action={submitNewExam} className="space-y-5">
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Exam details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Exam name *</span>
            <input
              name="name"
              required
              placeholder="Algebra Test #3"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Subject *</span>
            <input
              name="subjectName"
              required
              defaultValue="Mathematics"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Group *</span>
            <select name="groupId" required defaultValue="" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
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
            <span className="mb-1 block text-xs font-medium text-slate-600">Date *</span>
            <input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </label>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Topics &amp; max points</h3>
          <span className="text-xs text-slate-500">
            Total: <span className="font-semibold text-slate-800">{total} pts</span>
          </span>
        </div>
        <div className="space-y-2">
          {topics.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                name="topicName"
                required
                placeholder={`Topic ${i + 1} (e.g. Linear equations)`}
                value={t.name}
                onChange={(e) => {
                  const copy = [...topics];
                  copy[i] = { ...copy[i], name: e.target.value };
                  setTopics(copy);
                }}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <input
                name="topicMax"
                type="number"
                min={1}
                required
                value={t.max}
                onChange={(e) => {
                  const copy = [...topics];
                  copy[i] = { ...copy[i], max: Number(e.target.value) };
                  setTopics(copy);
                }}
                className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <span className="text-xs text-slate-400">pts</span>
              <button
                type="button"
                onClick={() => setTopics(topics.filter((_, idx) => idx !== i))}
                disabled={topics.length <= 1}
                className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTopics([...topics, { name: "", max: 10 }])}
          className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          + Add topic
        </button>
      </Card>

      <div className="flex justify-end gap-2">
        <SecondaryButton href="/exams">Cancel</SecondaryButton>
        <PrimaryButton type="submit">Create exam &amp; continue to results →</PrimaryButton>
      </div>
    </form>
  );
}
