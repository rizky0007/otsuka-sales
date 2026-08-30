"use client";

import {
  Menu,
  X,
  Bell,
} from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  return (
    <header className="main-header">
      <div className="header-left">

        {/* SATU-SATUNYA TOMBOL MENU */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="header-menu-button"
          aria-label={
            sidebarOpen
              ? "Tutup sidebar"
              : "Buka sidebar"
          }
        >
          {sidebarOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

        <div className="header-title">
          <h1>
            Otsuka Sales
          </h1>

          <p>
            Sales Management System
          </p>
        </div>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifikasi"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}