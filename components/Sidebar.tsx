"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Store,
  CalendarDays,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";

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

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Tombol Menu Mobile */}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setMobileOpen(true)}
        aria-label="Buka menu"
      >
        <Menu size={24} />
      </button>

      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">O</div>

            <div>
              <h2>Otsuka Sales</h2>
              <span>Sales Manager</span>
            </div>
          </div>

          {/* Tombol Tutup Mobile */}
          <button
            type="button"
            className="close-sidebar-button"
            onClick={closeSidebar}
            aria-label="Tutup menu"
          >
            <X size={22} />
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
                className={`sidebar-menu ${
                  isActive ? "active" : ""
                }`}
                onClick={closeSidebar}
              >
                <Icon size={20} />

                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link
            href="/login"
            className="sidebar-menu logout"
            onClick={closeSidebar}
          >
            <LogOut size={20} />

            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
}