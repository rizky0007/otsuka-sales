"use client";

import { Bell, Menu } from "lucide-react";

type HeaderProps = {
  title?: string;
};

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* LEFT */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile menu */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
          onClick={() => {
            window.dispatchEvent(new Event("toggle-sidebar"));
          }}
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-black text-slate-800 sm:text-base">
            {title || "Otsuka Sales"}
          </h1>

          <p className="hidden text-[10px] font-medium text-slate-400 sm:block">
            Sales Management System
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          aria-label="Notifikasi"
        >
          <Bell size={18} />
        </button>

        <div className="hidden h-9 items-center gap-2 rounded-xl bg-slate-50 px-3 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
            O
          </div>

          <span className="text-xs font-bold text-slate-700">
            Sales
          </span>
        </div>
      </div>
    </header>
  );
}npm run build