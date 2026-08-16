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
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event("toggle-sidebar"));
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-95 lg:hidden"
          aria-label="Buka menu"
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        {/* PAGE TITLE */}
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
        {/* NOTIFICATION */}
        <button
          type="button"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:bg-slate-50 active:scale-95"
          aria-label="Notifikasi"
        >
          <Bell size={18} strokeWidth={2} />

          {/* Notification Dot */}
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* USER */}
        <div className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 sm:flex">
          {/* Avatar */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
            O
          </div>

          {/* User Info */}
          <div className="hidden md:block">
            <div className="text-xs font-bold leading-none text-slate-700">
              Sales
            </div>

            <div className="mt-1 text-[9px] font-medium leading-none text-slate-400">
              Otsuka
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}