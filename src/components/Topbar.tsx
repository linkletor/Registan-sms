import SearchBox from "./SearchBox";
import SignOutButton from "./SignOutButton";

export default function Topbar({ name }: { name: string }) {
  return (
    <header className="no-print flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <SearchBox />
      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-slate-800">{name}</p>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
