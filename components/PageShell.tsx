"use client";

import { ReactNode } from "react";

export default function PageShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main
      className="
        min-h-screen
        bg-slate-50
        pt-16
        lg:pt-0
        lg:ml-[280px]
      "
    >
      {children}
    </main>
  );
}