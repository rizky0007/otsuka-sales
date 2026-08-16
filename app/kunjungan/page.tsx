"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  Store,
  X,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";

type VisitWeek = "GANJIL" | "GENAP";

type Outlet = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  visit_day: string;
  visit_week: VisitWeek;
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
  quantity: number | null;
  value: number | null;
  date: string;
};

type StatusFilter = "ALL" | "DONE" | "TODO";

const supabase = createClient();

/* =========================================================
   PRODUCT
========================================================= */

const PRODUCT_ORDER = [
  "POCARI",
  "ION",
  "SOYJOY",
  "FIBE",
  "ORONAMIN",
];

const PRODUCT_ICONS: Record<string, string> = {
  POCARI: "💧",
  ION: "💦",
  SOYJOY: "🥜",
  FIBE: "🌿",
  ORONAMIN: "⚡",
};

const PRODUCT_COLORS: Record<string, string> = {
  POCARI:
    "border-blue-200 bg-blue-50 text-blue-700",
  ION:
    "border-cyan-200 bg-cyan-50 text-cyan-700",
  SOYJOY:
    "border-amber-200 bg-amber-50 text-amber-700",
  FIBE:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  ORONAMIN:
    "border-orange-200 bg-orange-50 text-orange-700",
};

/* =========================================================
   DAY
========================================================= */

const DAY_NAMES: Record<string, string> = {
  MONDAY: "Senin",
  TUESDAY: "Selasa",
  WEDNESDAY: "Rabu",
  THURSDAY: "Kamis",
  FRIDAY: "Jumat",
  SATURDAY: "Sabtu",
};

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Sen",
  TUESDAY: "Sel",
  WEDNESDAY: "Rab",
  THURSDAY: "Kam",
  FRIDAY: "Jum",
  SATURDAY: "Sab",
};

const DAY_NUMBER_TO_NAME: Record<number, string> = {
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

/* =========================================================
   ERROR HELPER
========================================================= */

function getErrorMessage(error: unknown) {
  if (!error) {
    return "Terjadi error yang tidak diketahui.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object") {
    const e = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    return (
      e.message ||
      e.details ||
      e.hint ||
      e.code ||
      JSON.stringify(error)
    );
  }

  return String(error);
}

/* =========================================================
   PRODUCT KEY
   Menggabungkan semua varian menjadi satu.
========================================================= */

function getProductKey(product: Product) {
  const text =
    `${product.code} ${product.name}`.toUpperCase();

  if (
    text.includes("POCARI") ||
    text.includes("POCARI SWEAT")
  ) {
    return "POCARI";
  }

  if (
    text.includes("ION WATER") ||
    text.includes("IONWATER") ||
    text === "ION"
  ) {
    return "ION";
  }

  if (text.includes("SOYJOY")) {
    return "SOYJOY";
  }

  if (text.includes("FIBE")) {
    return "FIBE";
  }

  if (text.includes("ORONAMIN")) {
    return "ORONAMIN";
  }

  return product.code.toUpperCase();
}

/* =========================================================
   PRODUK FILTER
========================================================= */

function isHiddenProduct(product: Product) {
  const text =
    `${product.code} ${product.name}`.toUpperCase();

  if (text.includes("3 IN 1")) {
    return true;
  }

  if (text.includes("3IN1")) {
    return true;
  }

  return false;
}

/* =========================================================
   UNIQUE PRODUCTS
   Jika database masih mempunyai varian lama,
   UI hanya menampilkan satu produk.
========================================================= */

function normalizeProducts(products: Product[]) {
  const map = new Map<string, Product>();

  for (const product of products) {
    if (isHiddenProduct(product)) {
      continue;
    }

    const key = getProductKey(product);

    if (!PRODUCT_ORDER.includes(key)) {
      continue;
    }

    if (!map.has(key)) {
      map.set(key, product);
    }
  }

  return PRODUCT_ORDER
    .map((key) => map.get(key))
    .filter(Boolean) as Product[];
}

/* =========================================================
   SORT DATE
========================================================= */

function formatDateInput(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

/* =========================================================
   WEEK PARITY

   17 Agustus 2026 = GANJIL
   ISO week 34 = GANJIL
========================================================= */

function getVisitWeek(date: Date): VisitWeek {
  const temp = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
  );

  const dayNum =
    temp.getUTCDay() || 7;

  temp.setUTCDate(
    temp.getUTCDate() + 4 - dayNum
  );

  const yearStart = new Date(
    Date.UTC(
      temp.getUTCFullYear(),
      0,
      1
    )
  );

  const weekNumber = Math.ceil(
    (
      (
        temp.getTime() -
        yearStart.getTime()
      ) /
        86400000 +
        1
    ) / 7
  );

  return weekNumber % 2 === 0
    ? "GANJIL"
    : "GENAP";
}

/* =========================================================
   DAY NAME
========================================================= */

function getDayName(date: Date) {
  const day = date.getDay();

  if (day === 0) {
    return null;
  }

  return DAY_NUMBER_TO_NAME[day] ?? null;
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function KunjunganPage() {
  const [selectedDate, setSelectedDate] =
    useState(() => new Date());

  const [outlets, setOutlets] =
    useState<Outlet[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [savingKey, setSavingKey] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const dateString =
    formatDateInput(selectedDate);

  const dayName =
    getDayName(selectedDate);

  const visitWeek =
    getVisitWeek(selectedDate);

  /* =========================================================
     LOAD DATABASE
  ========================================================= */

  async function loadPage() {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!dayName) {
        setOutlets([]);
        setTransactions([]);

        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select(
            "id, code, name, icon, active"
          )
          .eq("active", true);

        if (productError) {
          throw new Error(
            `Gagal mengambil produk: ${getErrorMessage(
              productError
            )}`
          );
        }

        setProducts(
          normalizeProducts(
            (productData ?? []) as Product[]
          )
        );

        return;
      }

      /* =====================================================
         OUTLET
      ===================================================== */

      const {
        data: outletData,
        error: outletError,
      } = await supabase
        .from("outlets")
        .select(
          `
          id,
          code,
          name,
          address,
          visit_day,
          visit_week,
          active
          `
        )
        .eq("active", true)
        .eq("visit_day", dayName)
        .eq("visit_week", visitWeek)
        .order("name", {
          ascending: true,
        });

      if (outletError) {
        throw new Error(
          `Gagal mengambil outlet: ${getErrorMessage(
            outletError
          )}`
        );
      }

      /* =====================================================
         PRODUCT
      ===================================================== */

      const {
        data: productData,
        error: productError,
      } = await supabase
        .from("products")
        .select(
          `
          id,
          code,
          name,
          icon,
          active
          `
        )
        .eq("active", true);

      if (productError) {
        throw new Error(
          `Gagal mengambil produk: ${getErrorMessage(
            productError
          )}`
        );
      }

      /* =====================================================
         TRANSACTION
      ===================================================== */

      const {
        data: transactionData,
        error: transactionError,
      } = await supabase
        .from("transactions")
        .select(
          `
          id,
          outlet_id,
          product_id,
          quantity,
          value,
          date
          `
        )
        .eq("date", dateString);

      if (transactionError) {
        throw new Error(
          `Gagal mengambil transaksi: ${getErrorMessage(
            transactionError
          )}`
        );
      }

      setOutlets(
        (outletData ?? []) as Outlet[]
      );

      setProducts(
        normalizeProducts(
          (productData ?? []) as Product[]
        )
      );

      setTransactions(
        (transactionData ?? []) as Transaction[]
      );
    } catch (error) {
      console.error(
        "LOAD KUNJUNGAN ERROR:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, [dateString]);

  /* =========================================================
     TRANSACTION HELPER
  ========================================================= */

  function getProductTransactions(
    outletId: string,
    product: Product
  ) {
    const targetKey =
      getProductKey(product);

    return transactions.filter(
      (transaction) => {
        if (
          transaction.outlet_id !==
          outletId
        ) {
          return false;
        }

        const transactionProduct =
          products.find(
            (item) =>
              item.id ===
              transaction.product_id
          );

        if (!transactionProduct) {
          return false;
        }

        return (
          getProductKey(
            transactionProduct
          ) === targetKey
        );
      }
    );
  }

  function isTransactionDone(
    outletId: string,
    product: Product
  ) {
    return (
      getProductTransactions(
        outletId,
        product
      ).length > 0
    );
  }

  /* =========================================================
     TOGGLE TRANSACTION
  ========================================================= */

  async function toggleTransaction(
    outlet: Outlet,
    product: Product
  ) {
    const existing =
      getProductTransactions(
        outlet.id,
        product
      )[0];

    const key =
      `${outlet.id}-${getProductKey(product)}`;

    try {
      setSavingKey(key);
      setErrorMessage("");

      /* =====================================================
         DELETE
      ===================================================== */

      if (existing) {
        const {
          error,
        } = await supabase
          .from("transactions")
          .delete()
          .eq("id", existing.id);

        if (error) {
          throw new Error(
            getErrorMessage(error)
          );
        }

        setTransactions(
          (current) =>
            current.filter(
              (item) =>
                item.id !== existing.id
            )
        );

        return;
      }

      /* =====================================================
         INSERT
      ===================================================== */

      const {
        data,
        error,
      } = await supabase
        .from("transactions")
        .insert({
          outlet_id: outlet.id,
          product_id: product.id,
          quantity: 1,
          value: 0,
          date: dateString,
        })
        .select(
          `
          id,
          outlet_id,
          product_id,
          quantity,
          value,
          date
          `
        )
        .single();

      if (error) {
        throw new Error(
          getErrorMessage(error)
        );
      }

      if (data) {
        setTransactions(
          (current) => [
            ...current,
            data as Transaction,
          ]
        );
      }
    } catch (error) {
      console.error(
        "TOGGLE TRANSACTION ERROR:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setSavingKey(null);
    }
  }

  /* =========================================================
     FILTER OUTLET
  ========================================================= */

  const filteredOutlets =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return outlets.filter(
        (outlet) => {
          const matchesSearch =
            !keyword ||
            outlet.name
              .toLowerCase()
              .includes(keyword) ||
            outlet.code
              .toLowerCase()
              .includes(keyword) ||
            (
              outlet.address ?? ""
            )
              .toLowerCase()
              .includes(keyword);

          const done =
            transactions.some(
              (transaction) =>
                transaction.outlet_id ===
                outlet.id
            );

          const matchesStatus =
            statusFilter === "ALL" ||
            (
              statusFilter === "DONE" &&
              done
            ) ||
            (
              statusFilter === "TODO" &&
              !done
            );

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      outlets,
      transactions,
      search,
      statusFilter,
    ]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalOutlets =
    outlets.length;

  const completedOutlets =
    useMemo(() => {
      return outlets.filter(
        (outlet) =>
          transactions.some(
            (transaction) =>
              transaction.outlet_id ===
              outlet.id
          )
      ).length;
    }, [
      outlets,
      transactions,
    ]);

  const pendingOutlets =
    Math.max(
      totalOutlets -
        completedOutlets,
      0
    );

  const progress =
    totalOutlets === 0
      ? 0
      : Math.round(
          (
            completedOutlets /
            totalOutlets
          ) * 100
        );

  /* =========================================================
     DATE
  ========================================================= */

  function changeDate(
    amount: number
  ) {
    const next =
      new Date(selectedDate);

    next.setDate(
      next.getDate() + amount
    );

    setSelectedDate(next);
  }

  function goToday() {
    setSelectedDate(
      new Date()
    );
  }

  function selectWeekDay(
    key: string
  ) {
    const target =
      new Date(selectedDate);

    const currentDay =
      target.getDay() || 7;

    const targetDay =
      Object.entries(
        DAY_NUMBER_TO_NAME
      ).find(
        ([, value]) =>
          value === key
      );

    if (!targetDay) {
      return;
    }

    const targetNumber =
      Number(targetDay[0]);

    target.setDate(
      target.getDate() +
        (
          targetNumber -
          currentDay
        )
    );

    setSelectedDate(target);
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          SIDEBAR
          Sidebar tetap satu saja.
      ===================================================== */}

      <Sidebar />

      {/* =====================================================
          MAIN CONTENT

          PENTING:
          lg:ml-[280px] memberikan ruang untuk sidebar.
          Jadi konten tidak berada di bawah sidebar.
      ===================================================== */}

      <main
        className="
          min-h-screen
          min-w-0
          ml-0
          lg:ml-[280px]
          transition-[margin]
          duration-300
        "
      >
        <Header title="Kunjungan" />

        <div
          className="
            w-full
            max-w-[1500px]
            mx-auto
            px-3
            py-4
            sm:px-5
            sm:py-5
            lg:px-7
            xl:px-8
          "
        >
          {/* ===================================================
              PAGE HEADER
          ==================================================== */}

          <section className="mb-5">
            <div
              className="
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >
              <div className="min-w-0">
                <div
                  className="
                    mb-2
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-blue-50
                    px-3
                    py-1.5
                    text-[11px]
                    font-black
                    text-blue-700
                  "
                >
                  <MapPin size={13} />
                  JADWAL KUNJUNGAN
                </div>

                <h1
                  className="
                    text-2xl
                    font-black
                    tracking-tight
                    text-slate-900
                    sm:text-3xl
                  "
                >
                  Kunjungan Outlet
                </h1>

                <p
                  className="
                    mt-1
                    max-w-2xl
                    text-xs
                    leading-5
                    text-slate-500
                    sm:text-sm
                  "
                >
                  Outlet ditampilkan otomatis
                  berdasarkan hari dan minggu
                  kunjungan dari database.
                </p>
              </div>

              <button
                type="button"
                onClick={loadPage}
                disabled={loading}
                className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-black
                  text-slate-700
                  shadow-sm
                  transition
                  hover:bg-slate-50
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>
            </div>
          </section>

          {/* ===================================================
              DATE
          ==================================================== */}

          <section
            className="
              mb-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-3
              shadow-sm
              sm:p-5
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4
                xl:flex-row
                xl:items-center
                xl:justify-between
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-2
                  sm:gap-3
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    changeDate(-1)
                  }
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-600
                    transition
                    hover:bg-slate-50
                  "
                >
                  <ChevronLeft size={19} />
                </button>

                <div className="min-w-0 flex-1">
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      gap-2
                    "
                  >
                    <CalendarDays
                      size={18}
                      className="shrink-0 text-blue-600"
                    />

                    <h2
                      className="
                        truncate
                        text-sm
                        font-black
                        text-slate-900
                        sm:text-base
                      "
                    >
                      {formatLongDate(
                        selectedDate
                      )}
                    </h2>
                  </div>

                  <div
                    className="
                      mt-2
                      flex
                      flex-wrap
                      gap-1.5
                    "
                  >
                    {dayName ? (
                      <span
                        className="
                          rounded-full
                          bg-slate-100
                          px-2.5
                          py-1
                          text-[10px]
                          font-black
                          text-slate-600
                        "
                      >
                        {DAY_NAMES[dayName]}
                      </span>
                    ) : (
                      <span
                        className="
                          rounded-full
                          bg-red-50
                          px-2.5
                          py-1
                          text-[10px]
                          font-black
                          text-red-600
                        "
                      >
                        Minggu
                      </span>
                    )}

                    {dayName && (
                      <span
                        className={`
                          rounded-full
                          px-2.5
                          py-1
                          text-[10px]
                          font-black
                          ${
                            visitWeek ===
                            "GANJIL"
                              ? "bg-violet-50 text-violet-700"
                              : "bg-emerald-50 text-emerald-700"
                          }
                        `}
                      >
                        MINGGU {visitWeek}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    changeDate(1)
                  }
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-600
                    transition
                    hover:bg-slate-50
                  "
                >
                  <ChevronRight size={19} />
                </button>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-2
                  sm:flex
                "
              >
                <button
                  type="button"
                  onClick={goToday}
                  className="
                    rounded-xl
                    bg-slate-900
                    px-4
                    py-2.5
                    text-xs
                    font-black
                    text-white
                    transition
                    hover:bg-slate-800
                    sm:text-sm
                  "
                >
                  Hari Ini
                </button>

                <input
                  type="date"
                  value={dateString}
                  onChange={(event) => {
                    if (!event.target.value) {
                      return;
                    }

                    setSelectedDate(
                      parseLocalDate(
                        event.target.value
                      )
                    );
                  }}
                  className="
                    min-w-0
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-2.5
                    text-xs
                    font-bold
                    text-slate-700
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                    sm:text-sm
                  "
                />
              </div>
            </div>

            {dayName && (
              <div
                className="
                  mt-4
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  bg-blue-50
                  p-3
                "
              >
                <Clock3
                  size={16}
                  className="
                    mt-0.5
                    shrink-0
                    text-blue-600
                  "
                />

                <div>
                  <p
                    className="
                      text-xs
                      font-black
                      text-blue-800
                    "
                  >
                    Jadwal otomatis aktif
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-[11px]
                      leading-5
                      text-blue-700
                    "
                  >
                    Database menampilkan
                    outlet untuk{" "}
                    <strong>
                      {DAY_NAMES[dayName]}
                    </strong>{" "}
                    minggu{" "}
                    <strong>
                      {visitWeek}
                    </strong>.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ===================================================
              DAY SELECTOR
          ==================================================== */}

          <section
            className="
              mb-4
              grid
              grid-cols-3
              gap-2
              sm:grid-cols-6
            "
          >
            {Object.entries(
              DAY_NAMES
            ).map(
              ([key, label]) => {
                const active =
                  key === dayName;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      selectWeekDay(key)
                    }
                    className={`
                      rounded-xl
                      border
                      px-2
                      py-2.5
                      text-center
                      transition
                      sm:px-3
                      sm:py-3
                      ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                      }
                    `}
                  >
                    <p
                      className="
                        text-[9px]
                        font-black
                        uppercase
                        tracking-wide
                        opacity-70
                      "
                    >
                      {DAY_SHORT[key]}
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-black
                        sm:text-sm
                      "
                    >
                      {label}
                    </p>
                  </button>
                );
              }
            )}
          </section>

          {/* ===================================================
              STATISTICS
          ==================================================== */}

          <section
            className="
              mb-4
              grid
              grid-cols-2
              gap-2
              sm:gap-3
              lg:grid-cols-4
            "
          >
            <StatBox
              icon={<Store size={17} />}
              label="Total Outlet"
              value={totalOutlets}
              description={
                dayName
                  ? DAY_NAMES[dayName]
                  : "Minggu"
              }
              type="blue"
            />

            <StatBox
              icon={<Check size={17} />}
              label="Sudah Transaksi"
              value={completedOutlets}
              description={`${progress}% selesai`}
              type="green"
            />

            <StatBox
              icon={<Clock3 size={17} />}
              label="Belum Transaksi"
              value={pendingOutlets}
              description="Perlu dikunjungi"
              type="orange"
            />

            <StatBox
              icon={<Store size={17} />}
              label="Produk"
              value={products.length}
              description="Produk aktif"
              type="violet"
            />
          </section>

          {/* ===================================================
              PROGRESS
          ==================================================== */}

          <section
            className="
              mb-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              sm:p-5
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-black
                    text-slate-900
                  "
                >
                  Progress Kunjungan
                </p>

                <p
                  className="
                    mt-1
                    text-[11px]
                    text-slate-400
                  "
                >
                  {completedOutlets} dari{" "}
                  {totalOutlets} outlet
                  sudah transaksi
                </p>
              </div>

              <span
                className="
                  text-lg
                  font-black
                  text-blue-600
                "
              >
                {progress}%
              </span>
            </div>

            <div
              className="
                mt-4
                h-2.5
                overflow-hidden
                rounded-full
                bg-slate-100
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-blue-600
                  transition-all
                  duration-500
                "
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </section>

          {/* ===================================================
              SEARCH FILTER
          ==================================================== */}

          <section
            className="
              mb-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-3
              shadow-sm
              sm:p-4
            "
          >
            <div
              className="
                flex
                flex-col
                gap-2
                lg:flex-row
              "
            >
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Cari nama atau kode outlet..."
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    py-2.5
                    pl-9
                    pr-4
                    text-xs
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-2
                    focus:ring-blue-100
                    sm:text-sm
                  "
                />
              </div>

              <div
                className="
                  grid
                  grid-cols-3
                  gap-2
                  lg:w-[300px]
                "
              >
                <FilterButton
                  active={
                    statusFilter ===
                    "ALL"
                  }
                  onClick={() =>
                    setStatusFilter(
                      "ALL"
                    )
                  }
                >
                  Semua
                </FilterButton>

                <FilterButton
                  active={
                    statusFilter ===
                    "DONE"
                  }
                  onClick={() =>
                    setStatusFilter(
                      "DONE"
                    )
                  }
                >
                  Sudah
                </FilterButton>

                <FilterButton
                  active={
                    statusFilter ===
                    "TODO"
                  }
                  onClick={() =>
                    setStatusFilter(
                      "TODO"
                    )
                  }
                >
                  Belum
                </FilterButton>
              </div>
            </div>
          </section>

          {/* ===================================================
              ERROR
          ==================================================== */}

          {errorMessage && (
            <section
              className="
                mb-4
                flex
                items-start
                gap-3
                rounded-2xl
                border
                border-red-200
                bg-red-50
                p-4
                text-red-700
              "
            >
              <X
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <p
                  className="
                    text-sm
                    font-black
                  "
                >
                  Gagal mengambil data
                </p>

                <p
                  className="
                    mt-1
                    break-words
                    text-xs
                    leading-5
                  "
                >
                  {errorMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={loadPage}
                className="
                  shrink-0
                  rounded-lg
                  bg-white
                  px-3
                  py-2
                  text-xs
                  font-black
                  shadow-sm
                "
              >
                Coba Lagi
              </button>
            </section>
          )}

          {/* ===================================================
              SUNDAY
          ==================================================== */}

          {!dayName &&
            !loading && (
              <EmptyState
                icon={
                  <CalendarDays
                    size={28}
                  />
                }
                title="Hari Minggu"
                description="
                  Tidak ada jadwal kunjungan outlet
                  pada hari Minggu.
                "
              />
            )}

          {/* ===================================================
              LOADING
          ==================================================== */}

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      animate-pulse
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-5
                    "
                  >
                    <div
                      className="
                        h-4
                        w-40
                        rounded
                        bg-slate-200
                      "
                    />

                    <div
                      className="
                        mt-3
                        h-3
                        w-64
                        rounded
                        bg-slate-100
                      "
                    />

                    <div
                      className="
                        mt-5
                        h-20
                        w-full
                        rounded-xl
                        bg-slate-100
                      "
                    />
                  </div>
                )
              )}
            </div>
          )}

          {/* ===================================================
              NO OUTLET
          ==================================================== */}

          {!loading &&
            dayName &&
            filteredOutlets.length ===
              0 && (
              <EmptyState
                icon={
                  <Store size={28} />
                }
                title="Outlet tidak ditemukan"
                description={`
                  Tidak ada outlet ${DAY_NAMES[dayName]}
                  minggu ${visitWeek} yang sesuai
                  dengan filter.
                `}
              />
            )}

          {/* ===================================================
              OUTLET LIST
          ==================================================== */}

          {!loading &&
            dayName &&
            filteredOutlets.length >
              0 && (
              <section>
                <div
                  className="
                    mb-3
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div>
                    <h2
                      className="
                        text-lg
                        font-black
                        text-slate-900
                      "
                    >
                      Daftar Outlet
                    </h2>

                    <p
                      className="
                        mt-0.5
                        text-[11px]
                        text-slate-400
                      "
                    >
                      {filteredOutlets.length}{" "}
                      outlet ditampilkan
                    </p>
                  </div>

                  <div
                    className="
                      w-fit
                      rounded-lg
                      bg-white
                      px-3
                      py-2
                      text-[10px]
                      font-black
                      text-slate-500
                      shadow-sm
                      ring-1
                      ring-slate-200
                    "
                  >
                    {DAY_NAMES[dayName]}
                    {" • "}
                    {visitWeek}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredOutlets.map(
                    (
                      outlet,
                      index
                    ) => (
                      <OutletCard
                        key={
                          outlet.id
                        }
                        outlet={outlet}
                        index={index}
                        products={
                          products
                        }
                        transactions={
                          transactions
                        }
                        savingKey={
                          savingKey
                        }
                        onToggle={
                          toggleTransaction
                        }
                        getProductTransactions={
                          getProductTransactions
                        }
                      />
                    )
                  )}
                </div>
              </section>
            )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   OUTLET CARD
========================================================= */

function OutletCard({
  outlet,
  index,
  products,
  transactions,
  savingKey,
  onToggle,
  getProductTransactions,
}: {
  outlet: Outlet;
  index: number;
  products: Product[];
  transactions: Transaction[];
  savingKey: string | null;
  onToggle: (
    outlet: Outlet,
    product: Product
  ) => void;
  getProductTransactions: (
    outletId: string,
    product: Product
  ) => Transaction[];
}) {
  const outletTransactions =
    transactions.filter(
      (transaction) =>
        transaction.outlet_id ===
        outlet.id
    );

  const doneCount =
    products.filter(
      (product) =>
        getProductTransactions(
          outlet.id,
          product
        ).length > 0
    ).length;

  const outletDone =
    outletTransactions.length > 0;

  return (
    <article
      className={`
        overflow-hidden
        rounded-2xl
        border
        bg-white
        shadow-sm
        transition
        ${
          outletDone
            ? "border-emerald-200"
            : "border-slate-200"
        }
      `}
    >
      {/* =====================================================
          OUTLET HEADER
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          p-4
          sm:p-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div
          className="
            flex
            min-w-0
            items-start
            gap-3
          "
        >
          <div
            className={`
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-xs
              font-black
              ${
                outletDone
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }
            `}
          >
            {outletDone ? (
              <Check size={19} />
            ) : (
              index + 1
            )}
          </div>

          <div className="min-w-0">
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <h3
                className="
                  break-words
                  text-sm
                  font-black
                  text-slate-900
                  sm:text-base
                "
              >
                {outlet.name}
              </h3>

              {outletDone && (
                <span
                  className="
                    rounded-full
                    bg-emerald-50
                    px-2
                    py-1
                    text-[9px]
                    font-black
                    text-emerald-700
                  "
                >
                  SUDAH TRANSAKSI
                </span>
              )}
            </div>

            <p
              className="
                mt-1
                text-[10px]
                font-bold
                text-slate-400
              "
            >
              {outlet.code}
            </p>

            {outlet.address && (
              <div
                className="
                  mt-2
                  flex
                  items-start
                  gap-1.5
                  text-[11px]
                  leading-4
                  text-slate-500
                "
              >
                <MapPin
                  size={13}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />

                <span>
                  {outlet.address}
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          className="
            flex
            items-center
            justify-between
            gap-2
            sm:justify-end
          "
        >
          <div
            className={`
              rounded-xl
              px-3
              py-2
              text-center
              ${
                outletDone
                  ? "bg-emerald-50"
                  : "bg-slate-50"
              }
            `}
          >
            <p
              className={`
                text-sm
                font-black
                ${
                  outletDone
                    ? "text-emerald-700"
                    : "text-slate-700"
                }
              `}
            >
              {doneCount}/
              {products.length}
            </p>

            <p
              className="
                text-[8px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Produk
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          PRODUCTS / CHECKBOX
      ===================================================== */}

      <div
        className="
          border-t
          border-slate-100
          bg-slate-50/70
          p-3
          sm:p-4
        "
      >
        <div
          className="
            grid
            grid-cols-1
            gap-2
            sm:grid-cols-2
            xl:grid-cols-5
          "
        >
          {products.map(
            (product) => {
              const productDone =
                getProductTransactions(
                  outlet.id,
                  product
                ).length > 0;

              const productKey =
                getProductKey(
                  product
                );

              const saving =
                savingKey ===
                `${outlet.id}-${productKey}`;

              const colorClass =
                PRODUCT_COLORS[
                  productKey
                ] ??
                "border-slate-200 bg-slate-50 text-slate-700";

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    onToggle(
                      outlet,
                      product
                    )
                  }
                  className={`
                    group
                    flex
                    min-w-0
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    border
                    px-3
                    py-3
                    text-left
                    transition
                    disabled:cursor-wait
                    disabled:opacity-60
                    ${
                      productDone
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                    }
                  `}
                >
                  <div
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-2.5
                    "
                  >
                    <span
                      className={`
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        border
                        text-base
                        ${
                          productDone
                            ? "border-emerald-200 bg-white"
                            : colorClass
                        }
                      `}
                    >
                      {productDone ? (
                        <Check
                          size={17}
                          className="
                            text-emerald-600
                          "
                        />
                      ) : (
                        PRODUCT_ICONS[
                          productKey
                        ] ?? "📦"
                      )}
                    </span>

                    <span className="min-w-0">
                      <span
                        className="
                          block
                          truncate
                          text-xs
                          font-black
                          text-slate-800
                        "
                      >
                        {productKey ===
                        "POCARI"
                          ? "Pocari Sweat"
                          : productKey ===
                            "ION"
                          ? "Ion Water"
                          : product.name}
                      </span>

                      <span
                        className={`
                          mt-0.5
                          block
                          text-[10px]
                          font-bold
                          ${
                            productDone
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }
                        `}
                      >
                        {saving
                          ? "Menyimpan..."
                          : productDone
                          ? "Sudah transaksi"
                          : "Belum transaksi"}
                      </span>
                    </span>
                  </div>

                  {/* CHECKBOX */}

                  <span
                    className={`
                      flex
                      h-6
                      w-6
                      shrink-0
                      items-center
                      justify-center
                      rounded-md
                      border
                      transition
                      ${
                        productDone
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 bg-white text-transparent group-hover:border-blue-400"
                      }
                    `}
                  >
                    <Check size={13} />
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   STAT BOX
========================================================= */

function StatBox({
  icon,
  label,
  value,
  description,
  type,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  type:
    | "blue"
    | "green"
    | "orange"
    | "violet";
}) {
  const styles = {
    blue: {
      box:
        "bg-blue-50 text-blue-600",
      value:
        "text-blue-700",
    },
    green: {
      box:
        "bg-emerald-50 text-emerald-600",
      value:
        "text-emerald-700",
    },
    orange: {
      box:
        "bg-orange-50 text-orange-600",
      value:
        "text-orange-700",
    },
    violet: {
      box:
        "bg-violet-50 text-violet-600",
      value:
        "text-violet-700",
    },
  };

  const style =
    styles[type];

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-3
        shadow-sm
        sm:p-4
      "
    >
      <div
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          sm:h-9
          sm:w-9
        "
        style={{
          background:
            type === "blue"
              ? "#eff6ff"
              : type === "green"
              ? "#ecfdf5"
              : type === "orange"
              ? "#fff7ed"
              : "#f5f3ff",
        }}
      >
        <span
          className={
            style.box.split(
              " "
            )[1]
          }
        >
          {icon}
        </span>
      </div>

      <p
        className="
          mt-3
          text-[9px]
          font-black
          uppercase
          tracking-wide
          text-slate-400
          sm:text-[10px]
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-1
          text-xl
          font-black
          sm:text-2xl
          ${style.value}
        `}
      >
        {value}
      </p>

      <p
        className="
          mt-0.5
          truncate
          text-[9px]
          font-medium
          text-slate-400
        "
      >
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   FILTER BUTTON
========================================================= */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-xl
        px-3
        py-2.5
        text-[10px]
        font-black
        transition
        sm:text-xs
        ${
          active
            ? "bg-blue-600 text-white shadow-sm"
            : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        }
      `}
    >
      {children}
    </button>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-8
        text-center
        shadow-sm
        sm:p-12
      "
    >
      <div
        className="
          mx-auto
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-slate-100
          text-slate-400
        "
      >
        {icon}
      </div>

      <h3
        className="
          mt-4
          text-base
          font-black
          text-slate-900
        "
      >
        {title}
      </h3>

      <p
        className="
          mx-auto
          mt-2
          max-w-md
          text-xs
          leading-5
          text-slate-500
        "
      >
        {description}
      </p>
    </section>
  );
}