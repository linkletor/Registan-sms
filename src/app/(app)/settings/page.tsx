import { requireUser } from "@/lib/session";
import { listAllUsers } from "@/lib/data/users";
import { Card, PageHeader, Badge } from "@/components/ui";
import AddTutorForm from "./AddTutorForm";

export default async function SettingsPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const users = isAdmin ? await listAllUsers() : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" subtitle="Account and school configuration." />

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Your account</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-800">{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-800">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Role</dt>
            <dd>
              <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-600/20">{user.role}</Badge>
            </dd>
          </div>
        </dl>
      </Card>

      {isAdmin && (
        <>
          <Card padding={false}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-800">Tutors &amp; Admins</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-2.5 font-medium">Name</th>
                    <th className="px-5 py-2.5 font-medium">Email</th>
                    <th className="px-5 py-2.5 font-medium">Role</th>
                    <th className="px-5 py-2.5 font-medium">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                      <td className="px-5 py-3 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3">
                        <Badge
                          className={
                            u.role === "ADMIN"
                              ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                              : "bg-slate-50 text-slate-600 ring-slate-200"
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{u.phone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Add a tutor</h3>
            <AddTutorForm />
          </Card>
        </>
      )}
    </div>
  );
}
