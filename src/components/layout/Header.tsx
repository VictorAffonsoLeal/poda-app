import { User, Bell } from "lucide-react";
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold">
          RP
        </div>
        <h1 className="font-bold text-slate-800 dark:text-slate-100 truncate">Poda Digital</h1>
      </Link>
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
          <Bell size={20} className="text-slate-600 dark:text-slate-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>
        <Link href="/perfil" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2">
           <User size={20} className="text-slate-600 dark:text-slate-300" />
        </Link>
      </div>
    </header>
  );
}
