"use client";

import { signOutAction } from "@/lib/signout-action";

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
      >
        Sign out
      </button>
    </form>
  );
}
