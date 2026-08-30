"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  LayoutDashboard,
  TrendingUp,
  Store,
  CalendarDays,
  Menu,
  X,
  LogOut,
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      setMobileOpen(false);

      await supabase.auth.signOut();

      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* TOMBOL MENU MOBILE - HANYA SATU */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="mobile-menu-button"
        aria-label={
          mobileOpen ? "Tutup sidebar" : "Buka sidebar"
        }
      >
        {mobileOpen ? (
          <X size={24} />
        ) : (
          <Menu size={24} />
        )}
      </button>

      {/* OVERLAY */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        {/* HEADER */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              O
            </div>

            <div>
              <h2>Otsuka Sales</h2>

              <span>
                Sales Manager
              </span>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
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

        {/* LOGOUT */}
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
    </>
  );
}