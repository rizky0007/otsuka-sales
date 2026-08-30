"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  TrendingUp,
  Store,
  CalendarDays,
  LogOut,
  X,
} from "lucide-react";

import supabase from "@/lib/supabase/client";

const menuItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Value",
    href: "/value",
    icon: TrendingUp,
  },
  {
    name: "Transaksi",
    href: "/transaksi",
    icon: Store,
  },
  {
    name: "Kunjungan",
    href: "/kunjungan",
    icon: CalendarDays,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      onClose();

      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside
      className={`sidebar ${
        isOpen ? "sidebar-open" : ""
      }`}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            O
          </div>

          <div>
            <h2>
              Otsuka Sales
            </h2>

            <span>
              Sales Manager
            </span>
          </div>
        </div>

        {/* TOMBOL CLOSE HANYA MOBILE */}
        <button
          type="button"
          onClick={onClose}
          className="sidebar-close"
          aria-label="Tutup sidebar"
        >
          <X size={21} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`sidebar-menu ${
                isActive ? "active" : ""
              }`}
            >
              <Icon size={20} />

              <span>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-menu logout"
        >
          <LogOut size={20} />

          <span>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}