import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/dashboard";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            R
          </div>
          <h1 className="text-xl font-semibold text-white">Registan SMS</h1>
          <p className="mt-1 text-sm text-slate-400">
            Student Progress &amp; Tutor Management System
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
          <LoginForm callbackUrl={callbackUrl} />
        </div>

        <div className="mt-4 rounded-lg bg-slate-900/60 p-3 text-center text-xs text-slate-400 ring-1 ring-slate-800">
          Demo accounts — Admin: <span className="text-slate-200">admin@registan.uz / admin123</span>
          <br />
          Tutor: <span className="text-slate-200">tutor@registan.uz / tutor123</span>
        </div>
      </div>
    </div>
  );
}
