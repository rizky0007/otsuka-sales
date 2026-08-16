"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Filter,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  Store,
  X,
  CalendarDays,
  BarChart3,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Outlet = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  visit_day: string | null;
  visit_week: string | null;
  active: boolean;
};

type Product = {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  active: boolean;
};

type Transaction = {
  id: string;
  outlet_id: string;
  product_id: string;
  quantity: number;
  value: number;
  date: string;
};

/* =========================================================
   PRODUCT CONFIG
========================================================= */

const PRODUCT_ORDER = [
  "POCARI_ALL",
  "ION_ALL",
  "SOYJOY",
  "FIBE",
  "ORONAMIN",
];

const PRODUCT_NAMES: Record<string, string> = {
  POCARI_ALL: "Pocari Sweat — All Size",
  ION_ALL: "Ion Water — All Size",
  SOYJOY: "SOYJOY",
  FIBE: "Fibe Mini",
  ORONAMIN: "Oronamin C",
};

/* =========================================================
   FILTER OPTIONS
========================================================= */

const DAY_OPTIONS = [
  {
    value: "ALL",
    label: "Semua Hari",
  },
  {
    value: "MONDAY",
    label: "Senin",
  },
  {
    value: "TUESDAY",
    label: "Selasa",
  },
  {
    value: "WEDNESDAY",
    label: "Rabu",
  },
  {
    value: "THURSDAY",
    label: "Kamis",
  },
  {
    value: "FRIDAY",
    label: "Jumat",
  },
  {
    value: "SATURDAY",
    label: "Sabtu",
  },
];

const WEEK_OPTIONS = [
  {
    value: "ALL",
    label: "Semua Minggu",
  },
  {
    value: "GENAP",
    label: "Minggu Genap",
  },
  {
    value: "GANJIL",
    label: "Minggu Ganjil",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getToday() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDayLabel(day: string | null) {
  switch (day) {
    case "MONDAY":
      return "Senin";

    case "TUESDAY":
      return "Selasa";

    case "WEDNESDAY":
      return "Rabu";

    case "THURSDAY":
      return "Kamis";

    case "FRIDAY":
      return "Jumat";

    case "SATURDAY":
      return "Sabtu";

    default:
      return "-";
  }
}

function getWeekLabel(week: string | null) {
  if (week === "GENAP") return "Genap";
  if (week === "GANJIL") return "Ganjil";

  return "-";
}

/* =========================================================
   PRODUCT COLOR
========================================================= */

function getProductClass(code: string) {
  switch (code) {
    case "POCARI_ALL":
      return "bg-blue-50 text-blue-600 border-blue-100";

    case "ION_ALL":
      return "bg-cyan-50 text-cyan-600 border-cyan-100";

    case "SOYJOY":
      return "bg-amber-50 text-amber-600 border-amber-100";

    case "FIBE":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";

    case "ORONAMIN":
      return "bg-orange-50 text-orange-600 border-orange-100";

    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

/* =========================================================
   PRODUCT ICON
========================================================= */

function ProductIcon({
  code,
  size = 18,
}: {
  code: string;
  size?: number;
}) {
  return (
    <Package
      size={size}
      strokeWidth={2}
    />
  );
}

/* =========================================================
   PRODUCT TOTAL CARD
========================================================= */

function ProductTotalCard({
  product,
  total,
}: {
  product: Product;
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${getProductClass(
            product.code
          )}`}
        >
          <ProductIcon
            code={product.code}
            size={19}
          />
        </div>

        <div className="rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
          Transaksi
        </div>
      </div>

      <div className="mt-3">
        <div className="truncate text-xs font-bold text-slate-500">
          {PRODUCT_NAMES[product.code] || product.name}
        </div>

        <div className="mt-1 text-2xl font-black text-slate-900">
          {total}
        </div>

        <div className="mt-1 text-[10px] font-medium text-slate-400">
          outlet sudah transaksi
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function OutletsPage() {
  const supabase = useMemo(() => createClient(), []);

  /* =======================================================
     STATE
  ======================================================= */

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [selectedDay, setSelectedDay] = useState("ALL");
  const [selectedWeek, setSelectedWeek] = useState("ALL");

  const [selectedDate, setSelectedDate] =
    useState(getToday());

  const [expandedOutlet, setExpandedOutlet] =
    useState<string | null>(null);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, code, name, icon, active"
      )
      .in("code", PRODUCT_ORDER)
      .eq("active", true);

    if (error) {
      throw error;
    }

    const sorted = ((data || []) as Product[]).sort(
      (a, b) =>
        PRODUCT_ORDER.indexOf(a.code) -
        PRODUCT_ORDER.indexOf(b.code)
    );

    setProducts(sorted);
  }

  /* =======================================================
     LOAD OUTLETS
  ======================================================= */

  async function loadOutlets() {
    const { data, error } = await supabase
      .from("outlets")
      .select(
        "id, code, name, address, visit_day, visit_week, active"
      )
      .eq("active", true)
      .order("visit_day", {
        ascending: true,
      })
      .order("code", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    setOutlets((data || []) as Outlet[]);
  }

  /* =======================================================
     LOAD TRANSACTIONS
  ======================================================= */

  async function loadTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, outlet_id, product_id, quantity, value, date"
      )
      .eq("date", selectedDate);

    if (error) {
      throw error;
    }

    setTransactions(
      (data || []) as Transaction[]
    );
  }

  /* =======================================================
     LOAD ALL
  ======================================================= */

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadProducts(),
        loadOutlets(),
        loadTransactions(),
      ]);
    } catch (err: any) {
      console.error(
        "LOAD OUTLET PAGE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal mengambil data dari database."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [selectedDate]);

  /* =======================================================
     FILTER OUTLETS
  ======================================================= */

  const filteredOutlets = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return outlets.filter((outlet) => {
      const matchSearch =
        !keyword ||
        outlet.name
          .toLowerCase()
          .includes(keyword) ||
        outlet.code
          .toLowerCase()
          .includes(keyword) ||
        (outlet.address || "")
          .toLowerCase()
          .includes(keyword);

      const matchDay =
        selectedDay === "ALL" ||
        outlet.visit_day === selectedDay;

      const matchWeek =
        selectedWeek === "ALL" ||
        outlet.visit_week === selectedWeek;

      return (
        matchSearch &&
        matchDay &&
        matchWeek
      );
    });
  }, [
    outlets,
    search,
    selectedDay,
    selectedWeek,
  ]);

  /* =======================================================
     TRANSACTION CHECK
  ======================================================= */

  function isTransacted(
    outletId: string,
    productId: string
  ) {
    return transactions.some(
      (transaction) =>
        transaction.outlet_id === outletId &&
        transaction.product_id === productId
    );
  }

  function getOutletTransactionCount(
    outletId: string
  ) {
    return products.filter((product) =>
      isTransacted(
        outletId,
        product.id
      )
    ).length;
  }

  /* =======================================================
     TOTAL TRANSAKSI PER PRODUK
  ======================================================= */

  function getProductTransactionTotal(
    productId: string
  ) {
    return transactions.filter(
      (transaction) =>
        transaction.product_id === productId
    ).length;
  }

  /* =======================================================
     TOTAL QTY PER PRODUK
  ======================================================= */

  function getProductQuantityTotal(
    productId: string
  ) {
    return transactions
      .filter(
        (transaction) =>
          transaction.product_id === productId
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.quantity || 0),
        0
      );
  }

  /* =======================================================
     TOGGLE TRANSACTION
  ======================================================= */

  async function toggleTransaction(
    outlet: Outlet,
    product: Product
  ) {
    const key =
      `${outlet.id}-${product.id}`;

    setSaving(key);
    setError("");
    setMessage("");

    const exists = isTransacted(
      outlet.id,
      product.id
    );

    try {
      if (exists) {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq(
            "outlet_id",
            outlet.id
          )
          .eq(
            "product_id",
            product.id
          )
          .eq(
            "date",
            selectedDate
          );

        if (error) {
          throw error;
        }

        setTransactions((prev) =>
          prev.filter(
            (row) =>
              !(
                row.outlet_id ===
                  outlet.id &&
                row.product_id ===
                  product.id &&
                row.date ===
                  selectedDate
              )
          )
        );

        setMessage(
          `${product.name} di ${outlet.name} dibatalkan.`
        );
      } else {
        const { data, error } =
          await supabase
            .from("transactions")
            .insert({
              outlet_id: outlet.id,
              product_id: product.id,
              quantity: 1,
              value: 0,
              date: selectedDate,
            })
            .select(
              "id, outlet_id, product_id, quantity, value, date"
            )
            .single();

        if (error) {
          throw error;
        }

        if (data) {
          setTransactions((prev) => [
            ...prev,
            data as Transaction,
          ]);
        }

        setMessage(
          `${product.name} di ${outlet.name} berhasil ditandai transaksi.`
        );
      }
    } catch (err: any) {
      console.error(
        "TOGGLE TRANSACTION ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal menyimpan transaksi."
      );
    } finally {
      setSaving(null);
    }
  }

  /* =======================================================
     SUMMARY
  ======================================================= */

  const totalOutlet =
    filteredOutlets.length;

  const completedOutlets =
    filteredOutlets.filter(
      (outlet) =>
        products.length > 0 &&
        getOutletTransactionCount(
          outlet.id
        ) === products.length
    ).length;

  const totalChecks =
    filteredOutlets.reduce(
      (total, outlet) =>
        total +
        getOutletTransactionCount(
          outlet.id
        ),
      0
    );

  const totalPossible =
    filteredOutlets.length *
    products.length;

  const overallPercentage =
    totalPossible > 0
      ? (totalChecks /
          totalPossible) *
        100
      : 0;

  /* =======================================================
     PRODUCT TOTALS
  ======================================================= */

  const productTotals = useMemo(() => {
    return products.map((product) => ({
      product,
      total: getProductTransactionTotal(
        product.id
      ),
      quantity: getProductQuantityTotal(
        product.id
      ),
    }));
  }, [
    products,
    transactions,
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar />

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="min-h-screen lg:ml-[256px]">

        <Header />

        <main className="mx-auto w-full max-w-[1450px] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">

          {/* =================================================
              TOP HEADER
          ================================================= */}

          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                  <ShoppingBag size={18} />
                </div>

                <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Sales Activity
                </span>

              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Outlet Transaksi
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Tandai produk yang sudah
                berhasil ditransaksikan di
                setiap outlet.
              </p>
            </div>

            {/* DATE */}

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CalendarDays size={17} />
              </div>

              <div className="pr-2">

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tanggal transaksi
                </div>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(
                      e.target.value
                    )
                  }
                  className="mt-0.5 border-0 bg-transparent p-0 text-sm font-bold text-slate-700 outline-none"
                />

              </div>

            </div>

          </div>

          {/* =================================================
              ALERT
          ================================================= */}

          {message && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">

              <span className="flex items-center gap-2">
                <Check size={16} />
                {message}
              </span>

              <button
                onClick={() =>
                  setMessage("")
                }
                className="rounded-lg p-1 hover:bg-emerald-100"
              >
                <X size={15} />
              </button>

            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

              <span>{error}</span>

              <button
                onClick={() =>
                  setError("")
                }
                className="rounded-lg p-1 hover:bg-red-100"
              >
                <X size={15} />
              </button>

            </div>
          )}

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

            {/* OUTLET */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="flex items-center justify-between">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Outlet
                </span>

                <Store
                  size={17}
                  className="text-slate-300"
                />

              </div>

              <div className="mt-2 text-2xl font-black">
                {totalOutlet}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                outlet terfilter
              </div>

            </div>

            {/* COMPLETE */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="flex items-center justify-between">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Complete
                </span>

                <Check
                  size={17}
                  className="text-emerald-500"
                />

              </div>

              <div className="mt-2 text-2xl font-black text-emerald-600">
                {completedOutlets}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                semua produk transaksi
              </div>

            </div>

            {/* TRANSAKSI */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="flex items-center justify-between">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Transaksi
                </span>

                <ShoppingBag
                  size={17}
                  className="text-blue-500"
                />

              </div>

              <div className="mt-2 text-2xl font-black text-blue-600">
                {totalChecks}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                dari {totalPossible} kemungkinan
              </div>

            </div>

            {/* PROGRESS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="flex items-center justify-between">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Progress
                </span>

                <span className="text-sm font-black text-blue-600">
                  {overallPercentage.toFixed(0)}%
                </span>

              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      overallPercentage,
                      100
                    )}%`,
                  }}
                />

              </div>

              <div className="mt-2 text-xs text-slate-400">
                pencapaian transaksi
              </div>

            </div>

          </div>

          {/* =================================================
              TOTAL TRANSAKSI PER PRODUK
          ================================================= */}

          <section className="mb-5">

            <div className="mb-3 flex items-center gap-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <BarChart3 size={16} />
              </div>

              <div>
                <h2 className="text-sm font-black text-slate-800">
                  Total Transaksi Produk
                </h2>

                <p className="text-[10px] text-slate-400">
                  Rekap transaksi pada tanggal{" "}
                  {selectedDate}
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

              {productTotals.map(
                ({
                  product,
                  total,
                  quantity,
                }) => (
                  <ProductTotalCard
                    key={product.id}
                    product={product}
                    total={total}
                  />
                )
              )}

            </div>

          </section>

          {/* =================================================
              FILTER
          ================================================= */}

          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="mb-3 flex items-center gap-2">

              <Filter
                size={16}
                className="text-slate-400"
              />

              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Filter Outlet
              </span>

            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_190px_190px_auto]">

              {/* SEARCH */}

              <div className="relative">

                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Cari nama atau kode outlet..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

                {search && (
                  <button
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}

              </div>

              {/* DAY */}

              <select
                value={selectedDay}
                onChange={(e) =>
                  setSelectedDay(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              >
                {DAY_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              {/* WEEK */}

              <select
                value={selectedWeek}
                onChange={(e) =>
                  setSelectedWeek(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              >
                {WEEK_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              {/* RESET */}

              <button
                onClick={() => {
                  setSearch("");
                  setSelectedDay(
                    "ALL"
                  );
                  setSelectedWeek(
                    "ALL"
                  );
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Reset Filter
              </button>

            </div>

            {/* ACTIVE FILTER */}

            <div className="mt-3 flex flex-wrap items-center gap-2">

              {selectedDay !==
                "ALL" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600">

                  {getDayLabel(
                    selectedDay
                  )}

                  <button
                    onClick={() =>
                      setSelectedDay(
                        "ALL"
                      )
                    }
                  >
                    <X size={12} />
                  </button>

                </span>
              )}

              {selectedWeek !==
                "ALL" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-bold text-violet-600">

                  {getWeekLabel(
                    selectedWeek
                  )}

                  <button
                    onClick={() =>
                      setSelectedWeek(
                        "ALL"
                      )
                    }
                  >
                    <X size={12} />
                  </button>

                </span>
              )}

              {search && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">

                  "{search}"

                  <button
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    <X size={12} />
                  </button>

                </span>
              )}

            </div>

          </section>

          {/* =================================================
              PRODUCT LEGEND
          ================================================= */}

          <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Produk yang dipantau
            </div>

            <div className="flex flex-wrap gap-2">

              {products.map(
                (product) => (
                  <div
                    key={product.id}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${getProductClass(
                      product.code
                    )}`}
                  >

                    <ProductIcon
                      code={
                        product.code
                      }
                      size={15}
                    />

                    {PRODUCT_NAMES[
                      product.code
                    ] ||
                      product.name}

                  </div>
                )
              )}

            </div>

          </section>

          {/* =================================================
              OUTLET LIST
          ================================================= */}

          {loading ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="text-sm font-semibold text-slate-600">
                Memuat data outlet...
              </p>

            </div>

          ) : filteredOutlets.length ===
            0 ? (

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Store size={25} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-700">
                Outlet tidak ditemukan
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Coba ubah filter hari,
                minggu, atau kata
                pencarian.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setSelectedDay(
                    "ALL"
                  );
                  setSelectedWeek(
                    "ALL"
                  );
                }}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Reset Filter
              </button>

            </div>

          ) : (

            <div className="space-y-3">

              {filteredOutlets.map(
                (outlet, index) => {

                  const count =
                    getOutletTransactionCount(
                      outlet.id
                    );

                  const complete =
                    products.length >
                      0 &&
                    count ===
                      products.length;

                  const open =
                    expandedOutlet ===
                    outlet.id;

                  return (
                    <section
                      key={outlet.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                        complete
                          ? "border-emerald-200"
                          : "border-slate-200"
                      }`}
                    >

                      {/* OUTLET HEADER */}

                      <button
                        onClick={() =>
                          setExpandedOutlet(
                            open
                              ? null
                              : outlet.id
                          )
                        }
                        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 sm:p-5"
                      >

                        {/* NUMBER */}

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                            complete
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {index + 1}
                        </div>

                        {/* INFO */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h2 className="truncate text-sm font-black text-slate-800 sm:text-base">
                              {outlet.name}
                            </h2>

                            {complete && (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                Complete
                              </span>
                            )}

                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">

                            <span className="font-semibold">
                              {outlet.code}
                            </span>

                            <span className="flex items-center gap-1">
                              <CalendarDays
                                size={11}
                              />

                              {getDayLabel(
                                outlet.visit_day
                              )}
                            </span>

                            <span>
                              Minggu{" "}
                              {getWeekLabel(
                                outlet.visit_week
                              )}
                            </span>

                          </div>

                          {outlet.address && (
                            <div className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-400">

                              <MapPin
                                size={11}
                              />

                              {outlet.address}

                            </div>
                          )}

                        </div>

                        {/* PROGRESS */}

                        <div className="hidden min-w-[100px] text-right sm:block">

                          <div className="text-xs font-black text-slate-700">
                            {count}/
                            {products.length}
                          </div>

                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className={`h-full rounded-full transition-all ${
                                complete
                                  ? "bg-emerald-500"
                                  : "bg-blue-500"
                              }`}
                              style={{
                                width: `${
                                  products.length >
                                  0
                                    ? (count /
                                        products.length) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />

                          </div>

                        </div>

                        {/* MOBILE COUNT */}

                        <div className="flex shrink-0 flex-col items-end sm:hidden">

                          <span className="text-[10px] font-black text-slate-500">
                            {count}/
                            {products.length}
                          </span>

                          <div className="mt-1 h-1.5 w-10 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{
                                width: `${
                                  products.length >
                                  0
                                    ? (count /
                                        products.length) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />

                          </div>

                        </div>

                        {/* ARROW */}

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">

                          {open ? (
                            <ChevronUp
                              size={16}
                            />
                          ) : (
                            <ChevronDown
                              size={16}
                            />
                          )}

                        </div>

                      </button>

                      {/* PRODUCT AREA */}

                      {open && (
                        <div className="border-t border-slate-100 bg-[#fafbfc] p-4 sm:p-5">

                          <div className="mb-3 flex items-center justify-between">

                            <div>

                              <h3 className="text-xs font-black text-slate-700">
                                Status Transaksi
                              </h3>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Centang produk
                                yang sudah
                                ditransaksikan.
                              </p>

                            </div>

                            <div
                              className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                                complete
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {count} /{" "}
                              {products.length}
                            </div>

                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">

                            {products.map(
                              (product) => {

                                const checked =
                                  isTransacted(
                                    outlet.id,
                                    product.id
                                  );

                                const savingKey =
                                  `${outlet.id}-${product.id}`;

                                const isSaving =
                                  saving ===
                                  savingKey;

                                const productTotal =
                                  getProductTransactionTotal(
                                    product.id
                                  );

                                return (
                                  <button
                                    key={
                                      product.id
                                    }
                                    disabled={
                                      isSaving
                                    }
                                    onClick={() =>
                                      toggleTransaction(
                                        outlet,
                                        product
                                      )
                                    }
                                    className={`group flex min-h-[82px] items-center gap-3 rounded-xl border p-3 text-left transition ${
                                      checked
                                        ? "border-emerald-200 bg-emerald-50"
                                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                                    } ${
                                      isSaving
                                        ? "cursor-wait opacity-60"
                                        : ""
                                    }`}
                                  >

                                    {/* CHECKBOX */}

                                    <div
                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                                        checked
                                          ? "border-emerald-500 bg-emerald-500 text-white"
                                          : "border-slate-300 bg-white text-transparent group-hover:border-blue-400"
                                      }`}
                                    >

                                      {isSaving ? (

                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />

                                      ) : checked ? (

                                        <Check
                                          size={
                                            17
                                          }
                                          strokeWidth={
                                            3
                                          }
                                        />

                                      ) : (

                                        <Circle
                                          size={
                                            17
                                          }
                                          className="text-slate-300"
                                        />

                                      )}

                                    </div>

                                    {/* PRODUCT */}

                                    <div className="min-w-0 flex-1">

                                      <div
                                        className={`mb-1 flex h-7 w-7 items-center justify-center rounded-lg border ${getProductClass(
                                          product.code
                                        )}`}
                                      >

                                        <ProductIcon
                                          code={
                                            product.code
                                          }
                                          size={
                                            14
                                          }
                                        />

                                      </div>

                                      <div
                                        className={`truncate text-[11px] font-black ${
                                          checked
                                            ? "text-emerald-700"
                                            : "text-slate-700"
                                        }`}
                                      >
                                        {PRODUCT_NAMES[
                                          product.code
                                        ] ||
                                          product.name}
                                      </div>

                                      <div
                                        className={`mt-0.5 text-[9px] font-semibold ${
                                          checked
                                            ? "text-emerald-500"
                                            : "text-slate-400"
                                        }`}
                                      >
                                        {checked
                                          ? "Sudah transaksi"
                                          : "Belum transaksi"}
                                      </div>

                                    </div>

                                  </button>
                                );
                              }
                            )}

                          </div>

                        </div>
                      )}

                    </section>
                  );
                }
              )}

            </div>

          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          {!loading &&
            filteredOutlets.length >
              0 && (

              <div className="mt-5 flex flex-col items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-400 sm:flex-row">

                <span>
                  Menampilkan{" "}
                  <strong className="text-slate-600">
                    {
                      filteredOutlets.length
                    }
                  </strong>{" "}
                  outlet
                </span>

                <span>
                  Tanggal:{" "}
                  <strong className="text-slate-600">
                    {selectedDate}
                  </strong>
                </span>

              </div>
            )}

        </main>

      </div>

    </div>
  );
}