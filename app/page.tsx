"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Cookie,
  Droplets,
  Leaf,
  Package,
  RefreshCw,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Product = {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  active: boolean;
};

type DailyValue = {
  id: string;
  product_id: string;
  date: string;
  value: number;
};

type MonthlyTarget = {
  id: string;
  product_id: string;
  month: string;
  target_value: number;
  working_days: number;
};

/* =========================================================
   PRODUCT YANG DITAMPILKAN DI VALUE
========================================================= */

const VALUE_PRODUCT_CODES = [
  "POCARI_ALL",
  "ION_ALL",
  "SOYJOY",
  "FIBE",
  "ORONAMIN",
];

/* =========================================================
   FORMAT
========================================================= */

function formatRupiah(value: number) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(number));
}

function formatShort(value: number) {
  const number = Number(value) || 0;

  if (number >= 1_000_000_000) {
    return `Rp ${(number / 1_000_000_000).toFixed(1)} M`;
  }

  if (number >= 1_000_000) {
    return `Rp ${(number / 1_000_000).toFixed(1)} jt`;
  }

  if (number >= 1_000) {
    return `Rp ${(number / 1_000).toFixed(0)} rb`;
  }

  return formatRupiah(number);
}

function formatMonth(month: string) {
  if (!month) return "-";

  return new Date(`${month}-01T00:00:00`).toLocaleDateString(
    "id-ID",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function formatDate(date: string) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getCurrentMonth() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

/* =========================================================
   PRODUCT ICON
========================================================= */

function ProductIcon({
  code,
  size = 20,
}: {
  code: string;
  size?: number;
}) {
  const props = {
    size,
    strokeWidth: 1.8,
  };

  switch (code) {
    case "POCARI_ALL":
      return <Package {...props} />;

    case "ION_ALL":
      return <Droplets {...props} />;

    case "SOYJOY":
      return <Cookie {...props} />;

    case "FIBE":
      return <Leaf {...props} />;

    case "ORONAMIN":
      return <Zap {...props} />;

    default:
      return <Package {...props} />;
  }
}

/* =========================================================
   ERROR HELPER
========================================================= */

function getErrorMessage(error: unknown) {
  if (!error) {
    return "Terjadi kesalahan.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;

    if (typeof obj.message === "string") {
      return obj.message;
    }

    if (typeof obj.details === "string") {
      return obj.details;
    }

    if (typeof obj.hint === "string") {
      return obj.hint;
    }
  }

  return "Terjadi kesalahan database.";
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  /* =======================================================
     STATE
  ======================================================= */

  const [products, setProducts] = useState<Product[]>([]);
  const [dailyValues, setDailyValues] = useState<DailyValue[]>([]);
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, code, name, icon, active")
      .in("code", VALUE_PRODUCT_CODES)
      .eq("active", true);

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    const sorted = ((data || []) as Product[]).sort(
      (a, b) =>
        VALUE_PRODUCT_CODES.indexOf(a.code) -
        VALUE_PRODUCT_CODES.indexOf(b.code)
    );

    setProducts(sorted);
  }, [supabase]);

  /* =======================================================
     LOAD DAILY VALUE
  ======================================================= */

  const loadDailyValues = useCallback(async () => {
    const startDate = `${selectedMonth}-01`;

    const [yearString, monthString] =
      selectedMonth.split("-");

    const year = Number(yearString);
    const month = Number(monthString);

    const nextMonth =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-01`;

    const { data, error } = await supabase
      .from("daily_values")
      .select("id, product_id, date, value")
      .gte("date", startDate)
      .lt("date", nextMonth)
      .order("date", {
        ascending: true,
      });

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    setDailyValues(
      ((data || []) as DailyValue[])
    );
  }, [supabase, selectedMonth]);

  /* =======================================================
     LOAD TARGET
  ======================================================= */

  const loadTargets = useCallback(async () => {
    const monthDate = `${selectedMonth}-01`;

    const { data, error } = await supabase
      .from("monthly_targets")
      .select(
        "id, product_id, month, target_value, working_days"
      )
      .eq("month", monthDate);

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    setTargets(
      ((data || []) as MonthlyTarget[])
    );
  }, [supabase, selectedMonth]);

  /* =======================================================
     LOAD ALL
  ======================================================= */

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        await loadProducts();

        await Promise.all([
          loadDailyValues(),
          loadTargets(),
        ]);
      } catch (err) {
        console.error(
          "DASHBOARD LOAD ERROR:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      loadProducts,
      loadDailyValues,
      loadTargets,
    ]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
     PRODUCT IDS
  ======================================================= */

  const productIds = useMemo(() => {
    return new Set(
      products.map(
        (product) => product.id
      )
    );
  }, [products]);

  /* =======================================================
     FILTER DAILY VALUE
     
     PENTING:
     Dashboard hanya menghitung product yang
     masuk VALUE_PRODUCT_CODES.
     
     Jadi produk lain tidak ikut total.
  ======================================================= */

  const validDailyValues = useMemo(() => {
    return dailyValues.filter(
      (row) =>
        productIds.has(
          row.product_id
        )
    );
  }, [
    dailyValues,
    productIds,
  ]);

  /* =======================================================
     TOTAL VALUE BULANAN
     
     SUM dari daily_values.
  ======================================================= */

  const totalValue = useMemo(() => {
    return validDailyValues.reduce(
      (sum, row) =>
        sum + Number(row.value || 0),
      0
    );
  }, [validDailyValues]);

  /* =======================================================
     TOTAL TARGET
     
     SUM monthly_targets berdasarkan produk
     yang aktif di dashboard.
  ======================================================= */

  const totalTarget = useMemo(() => {
    return products.reduce(
      (sum, product) => {
        const target = targets.find(
          (item) =>
            item.product_id ===
            product.id
        );

        return (
          sum +
          Number(
            target?.target_value || 0
          )
        );
      },
      0
    );
  }, [products, targets]);

  /* =======================================================
     WORKING DAYS
  ======================================================= */

  const workingDays = useMemo(() => {
    const values = targets
      .map((item) =>
        Number(item.working_days)
      )
      .filter(
        (value) =>
          Number.isFinite(value) &&
          value > 0
      );

    if (!values.length) {
      return 24;
    }

    return values[0];
  }, [targets]);

  /* =======================================================
     DAILY TARGET
  ======================================================= */

  const dailyTarget =
    workingDays > 0
      ? totalTarget / workingDays
      : 0;

  /* =======================================================
     ACHIEVEMENT
  ======================================================= */

  const achievement =
    totalTarget > 0
      ? (totalValue / totalTarget) *
        100
      : 0;

  /* =======================================================
     GAP
  ======================================================= */

  const gap =
    totalTarget - totalValue;

  /* =======================================================
     TODAY
  ======================================================= */

  const today = new Date();

  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const todayValue = useMemo(() => {
    return validDailyValues
      .filter(
        (row) =>
          row.date === todayString
      )
      .reduce(
        (sum, row) =>
          sum + Number(row.value || 0),
        0
      );
  }, [
    validDailyValues,
    todayString,
  ]);

  /* =======================================================
     DAYS WITH DATA
  ======================================================= */

  const activeDays = useMemo(() => {
    return new Set(
      validDailyValues.map(
        (row) => row.date
      )
    ).size;
  }, [validDailyValues]);

  /* =======================================================
     PRODUCT PERFORMANCE
  ======================================================= */

  const productPerformance =
    useMemo(() => {
      return products.map(
        (product) => {
          const actual =
            validDailyValues
              .filter(
                (row) =>
                  row.product_id ===
                  product.id
              )
              .reduce(
                (sum, row) =>
                  sum +
                  Number(
                    row.value || 0
                  ),
                0
              );

          const target =
            Number(
              targets.find(
                (item) =>
                  item.product_id ===
                  product.id
              )?.target_value || 0
            );

          const percentage =
            target > 0
              ? (actual / target) *
                100
              : 0;

          return {
            product,
            actual,
            target,
            percentage,
            gap: target - actual,
          };
        }
      );
    }, [
      products,
      validDailyValues,
      targets,
    ]);

  /* =======================================================
     DAILY HISTORY
  ======================================================= */

  const dailyHistory = useMemo(() => {
    const grouped: Record<
      string,
      number
    > = {};

    validDailyValues.forEach(
      (row) => {
        grouped[row.date] =
          (grouped[row.date] || 0) +
          Number(row.value || 0);
      }
    );

    return Object.entries(grouped)
      .map(
        ([date, value]) => ({
          date,
          value,
        })
      )
      .sort((a, b) =>
        b.date.localeCompare(
          a.date
        )
      );
  }, [validDailyValues]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <Sidebar />

        <div className="min-h-screen transition-all duration-300 lg:ml-[256px]">
          <Header />

          <main className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-5">
              <div className="h-20 rounded-2xl bg-white" />

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 rounded-2xl bg-white"
                  />
                ))}
              </div>

              <div className="h-80 rounded-2xl bg-white" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <Sidebar />

      {/* ===================================================
          MAIN
      =================================================== */}

      <div
        className="
          min-h-screen
          transition-[margin]
          duration-300
          ease-in-out
          lg:ml-[256px]
        "
      >
        <Header />

        <main className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
          {/* =================================================
              TOP HEADER
          ================================================= */}

          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Activity size={18} />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    Dashboard
                  </h1>

                  <p className="text-xs text-slate-400 sm:text-sm">
                    Monitoring value sales
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
              <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:flex-none">
                <CalendarDays
                  size={16}
                  className="text-slate-400"
                />

                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(
                      e.target.value
                    )
                  }
                  className="min-w-0 bg-transparent text-xs font-semibold text-slate-700 outline-none"
                />
              </div>

              <button
                onClick={() =>
                  void loadDashboard(true)
                }
                disabled={refreshing}
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="font-semibold">
                Gagal mengambil data
              </div>

              <div className="mt-1 break-words text-xs">
                {error}
              </div>
            </div>
          )}

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {/* TARGET */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Target Bulanan
                  </div>

                  <div className="mt-2 text-lg font-bold sm:text-xl">
                    {formatShort(
                      totalTarget
                    )}
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400">
                    {formatRupiah(
                      totalTarget
                    )}
                  </div>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Target size={18} />
                </div>
              </div>
            </div>

            {/* ACTUAL */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Value Bulanan
                  </div>

                  <div className="mt-2 text-lg font-bold sm:text-xl">
                    {formatShort(
                      totalValue
                    )}
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400">
                    {formatRupiah(
                      totalValue
                    )}
                  </div>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet size={18} />
                </div>
              </div>
            </div>

            {/* ACHIEVEMENT */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Achievement
                  </div>

                  <div
                    className={`mt-2 text-lg font-bold sm:text-xl ${
                      achievement >= 100
                        ? "text-emerald-600"
                        : achievement >=
                          80
                        ? "text-amber-500"
                        : "text-blue-600"
                    }`}
                  >
                    {achievement.toFixed(
                      1
                    )}
                    %
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            achievement,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <TrendingUp size={18} />
                </div>
              </div>
            </div>

            {/* GAP */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    GAP
                  </div>

                  <div
                    className={`mt-2 text-lg font-bold sm:text-xl ${
                      gap > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {gap > 0 ? "-" : "+"}
                    {formatShort(
                      Math.abs(gap)
                    )}
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400">
                    {gap > 0
                      ? "Masih kurang"
                      : "Target tercapai"}
                  </div>
                </div>

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    gap > 0
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {gap > 0 ? (
                    <ArrowDownRight size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              QUICK INFO
          ================================================= */}

          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Value Hari Ini
              </div>

              <div className="mt-1 text-base font-bold text-slate-800">
                {formatShort(
                  todayValue
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Target / Hari
              </div>

              <div className="mt-1 text-base font-bold text-slate-800">
                {formatShort(
                  dailyTarget
                )}
              </div>
            </div>

            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:col-span-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hari Update
              </div>

              <div className="mt-1 text-base font-bold text-slate-800">
                {activeDays}{" "}
                <span className="text-xs font-medium text-slate-400">
                  hari
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              PRODUCT PERFORMANCE
          ================================================= */}

          <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Performance Produk
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {formatMonth(
                    selectedMonth
                  )}
                </p>
              </div>

              <div className="text-xs text-slate-400">
                {products.length} produk
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {productPerformance.map(
                (item) => (
                  <div
                    key={
                      item.product.id
                    }
                    className="px-4 py-4 sm:px-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <ProductIcon
                          code={
                            item.product.code
                          }
                          size={19}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="truncate text-sm font-semibold text-slate-800">
                            {
                              item
                                .product
                                .name
                            }
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-sm font-bold ${
                                item.percentage >=
                                100
                                  ? "text-emerald-600"
                                  : item.percentage >=
                                    80
                                  ? "text-amber-600"
                                  : "text-slate-700"
                              }`}
                            >
                              {item.percentage.toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.percentage >=
                              100
                                ? "bg-emerald-500"
                                : item.percentage >=
                                  80
                                ? "bg-amber-400"
                                : "bg-blue-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  item.percentage,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex flex-col gap-1 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                          <span>
                            Actual{" "}
                            <b className="text-slate-600">
                              {formatRupiah(
                                item.actual
                              )}
                            </b>
                          </span>

                          <span>
                            Target{" "}
                            <b className="text-slate-600">
                              {formatRupiah(
                                item.target
                              )}
                            </b>
                          </span>

                          <span
                            className={
                              item.gap >
                              0
                                ? "text-red-500"
                                : "text-emerald-600"
                            }
                          >
                            GAP{" "}
                            {item.gap >
                            0
                              ? "-"
                              : "+"}
                            {formatShort(
                              Math.abs(
                                item.gap
                              )
                            )}
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className="hidden text-slate-300 sm:block"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* =================================================
              HISTORY
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Aktivitas Value
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Riwayat update bulan{" "}
                  {formatMonth(
                    selectedMonth
                  )}
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500">
                {dailyHistory.length} hari
              </div>
            </div>

            {dailyHistory.length ===
            0 ? (
              <div className="px-5 py-12 text-center">
                <TrendingUp
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Belum ada data value
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Update value harian
                  akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dailyHistory
                  .slice(0, 10)
                  .map((item) => (
                    <div
                      key={
                        item.date
                      }
                      className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
                    >
                      <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100">
                        <span className="text-[8px] font-semibold uppercase text-slate-400">
                          {new Date(
                            `${item.date}T00:00:00`
                          ).toLocaleDateString(
                            "id-ID",
                            {
                              month:
                                "short",
                            }
                          )}
                        </span>

                        <span className="text-sm font-bold text-slate-700">
                          {new Date(
                            `${item.date}T00:00:00`
                          ).getDate()}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-700 sm:text-sm">
                          {formatDate(
                            item.date
                          )}
                        </div>

                        <div className="mt-0.5 text-[10px] text-slate-400">
                          Update value
                          harian
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800 sm:text-sm">
                          {formatShort(
                            item.value
                          )}
                        </div>

                        <div className="mt-0.5 text-[9px] text-slate-400">
                          value
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* =================================================
              FOOTER INFO
          ================================================= */}

          <div className="mt-5 flex flex-col gap-1 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Data dashboard berasal dari
              database Supabase.
            </span>

            <span>
              {formatMonth(
                selectedMonth
              )}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}