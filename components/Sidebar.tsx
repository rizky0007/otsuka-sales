"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Target,
  CalendarDays,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  WalletCards,
  Package,
  LogOut,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type SidebarProps = {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onToggle?: () => void;
  onMobileClose?: () => void;
};

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Transaksi",
    href: "/transaksi",
    icon: ShoppingCart,
  },
  {
    label: "Value",
    href: "/value",
    icon: WalletCards,
  },
  {
    label: "Outlet",
    href: "/outlets",
    icon: Store,
  },
  {
    label: "Kunjungan",
    href: "/kunjungan",
    icon: CalendarDays,
  },
  {
    label: "Target",
    href: "/target",
    icon: Target,
  },
];

export default function Sidebar({
  collapsed = false,
  mobileOpen = false,
  onToggle = () => {},
  onMobileClose = () => {},
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);

  const supabase = createClient();

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("LOGOUT ERROR:", error);
        setLoggingOut(false);
        return;
      }

      // Tidak lagi bergantung pada onMobileClose
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      <div
        className={`
          fixed inset-0 z-40
          bg-slate-950/50
          backdrop-blur-[2px]
          transition-opacity duration-300
          lg:hidden
          ${
            mobileOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
        onClick={onMobileClose}
      />

      {/* =====================================================
          MOBILE BUTTON
      ====================================================== */}
      <button
        type="button"
        onClick={onToggle}
        className="
          fixed left-4 top-4 z-[60]
          flex h-11 w-11
          items-center justify-center
          rounded-xl
          border border-slate-200
          bg-white
          text-slate-700
          shadow-lg
          shadow-slate-900/10
          transition-all
          hover:scale-105
          hover:bg-slate-50
          active:scale-95
          lg:hidden
        "
        aria-label={
          mobileOpen ? "Tutup menu" : "Buka menu"
        }
      >
        {mobileOpen ? (
          <X size={20} />
        ) : (
          <Menu size={20} />
        )}
      </button>

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col
          border-r border-slate-200
          bg-white
          shadow-xl shadow-slate-900/5
          transition-[width,transform]
          duration-300
          ease-in-out

          ${
            collapsed
              ? "lg:w-[76px]"
              : "lg:w-[256px]"
          }

          w-[280px]

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* ===================================================
            HEADER / LOGO
        ==================================================== */}
        <div
          className={`
            flex h-[76px]
            shrink-0
            items-center
            border-b border-slate-100
            ${
              collapsed
                ? "justify-center px-3"
                : "justify-between px-5"
            }
          `}
        >
          <Link
            href="/"
            onClick={onMobileClose}
            className="
              flex min-w-0
              items-center
              gap-3
              overflow-hidden
            "
          >
            <div
              className="
                flex h-10 w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-slate-900
                text-white
                shadow-sm
              "
            >
              <Package size={20} />
            </div>

            <div
              className={`
                min-w-0
                overflow-hidden
                transition-all
                duration-300
                ${
                  collapsed
                    ? "w-0 opacity-0"
                    : "w-auto opacity-100"
                }
              `}
            >
              <p
                className="
                  whitespace-nowrap
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                OTSUKA SALES
              </p>

              <p
                className="
                  whitespace-nowrap
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-slate-400
                "
              >
                Management
              </p>
            </div>
          </Link>

          {/* DESKTOP COLLAPSE */}
          <button
            type="button"
            onClick={onToggle}
            className="
              hidden
              h-9 w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              lg:flex
            "
            aria-label={
              collapsed
                ? "Buka sidebar"
                : "Tutup sidebar"
            }
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* ===================================================
            MENU
        ==================================================== */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p
            className={`
              mb-3
              px-3
              text-[10px]
              font-black
              uppercase
              tracking-[0.16em]
              text-slate-400
              transition-all
              duration-300
              ${
                collapsed
                  ? "text-center opacity-0"
                  : "opacity-100"
              }
            `}
          >
            Menu
          </p>

          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/" &&
                  pathname.startsWith(
                    `${item.href}/`
                  ));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                  className={`
                    group
                    relative
                    flex
                    h-11
                    items-center
                    gap-3
                    rounded-xl
                    transition-all
                    duration-200

                    ${
                      collapsed
                        ? "justify-center px-2"
                        : "px-3"
                    }

                    ${
                      active
                        ? `
                          bg-slate-900
                          text-white
                          shadow-md
                          shadow-slate-900/10
                        `
                        : `
                          text-slate-500
                          hover:bg-slate-100
                          hover:text-slate-900
                        `
                    }
                  `}
                >
                  <Icon
                    size={19}
                    className="
                      shrink-0
                      transition-transform
                      duration-200
                      group-hover:scale-105
                    "
                  />

                  <span
                    className={`
                      whitespace-nowrap
                      text-sm
                      font-bold
                      transition-all
                      duration-300
                      ${
                        collapsed
                          ? "w-0 overflow-hidden opacity-0"
                          : "w-auto opacity-100"
                      }
                    `}
                  >
                    {item.label}
                  </span>

                  {active && (
                    <span
                      className="
                        absolute
                        right-2
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-white
                      "
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ===================================================
            BOTTOM
        ==================================================== */}
        <div
          className="
            shrink-0
            border-t
            border-slate-100
            p-3
          "
        >
          {/* INFO */}
          <div
            className={`
              mb-2
              rounded-xl
              bg-slate-50
              ${
                collapsed
                  ? "p-2"
                  : "p-3"
              }
            `}
          >
            <div
              className={`
                flex
                items-center
                ${
                  collapsed
                    ? "justify-center"
                    : "gap-3"
                }
              `}
            >
              <div
                className="
                  flex
                  h-9 w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-white
                  text-slate-700
                  shadow-sm
                "
              >
                <Target size={17} />
              </div>

              <div
                className={`
                  min-w-0
                  overflow-hidden
                  transition-all
                  duration-300
                  ${
                    collapsed
                      ? "w-0 opacity-0"
                      : "w-auto opacity-100"
                  }
                `}
              >
                <p
                  className="
                    whitespace-nowrap
                    text-xs
                    font-black
                    text-slate-700
                  "
                >
                  Sales App
                </p>

                <p
                  className="
                    whitespace-nowrap
                    text-[10px]
                    text-slate-400
                  "
                >
                  Otsuka Indonesia
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              LOGOUT
          ================================================== */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={
              collapsed
                ? "Logout"
                : undefined
            }
            className={`
              group
              flex
              h-11
              w-full
              items-center
              gap-3
              rounded-xl
              border
              border-red-100
              bg-white
              text-red-500
              transition-all
              duration-200

              ${
                collapsed
                  ? "justify-center px-2"
                  : "px-3"
              }

              hover:border-red-200
              hover:bg-red-50
              hover:text-red-600

              disabled:cursor-not-allowed
              disabled:opacity-60
            `}
          >
            {loggingOut ? (
              <Loader2
                size={19}
                className="
                  shrink-0
                  animate-spin
                "
              />
            ) : (
              <LogOut
                size={19}
                className="
                  shrink-0
                  transition-transform
                  group-hover:translate-x-0.5
                "
              />
            )}

            <span
              className={`
                whitespace-nowrap
                text-sm
                font-bold
                transition-all
                duration-300
                ${
                  collapsed
                    ? "w-0 overflow-hidden opacity-0"
                    : "w-auto opacity-100"
                }
              `}
            >
              {loggingOut
                ? "Keluar..."
                : "Logout"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}