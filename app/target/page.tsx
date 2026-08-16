"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  RefreshCw,
  Save,
  Target,
  TrendingUp,
  X,
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

type MonthlyTarget = {
  id: string;
  product_id: string;
  month: string;
  target_value: number;
  working_days: number;
};

type DailyValue = {
  id: string;
  product_id: string;
  date: string;
  value: number;
};

/* =========================================================
   PRODUCT ORDER
========================================================= */

const PRODUCT_ORDER = [
  "POCARI_ALL",
  "ION_ALL",
  "SOYJOY",
  "FIBE",
  "ORONAMIN",
];

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient();

/* =========================================================
   HELPERS
========================================================= */

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));
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

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(
    "id-ID",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  const date = new Date(
    year,
    monthNumber - 2,
    1
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getNextMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  const date = new Date(
    year,
    monthNumber,
    1
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getWorkingDaysInMonth(month: string) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  const totalDays = new Date(
    year,
    monthNumber,
    0
  ).getDate();

  let workingDays = 0;

  for (
    let day = 1;
    day <= totalDays;
    day++
  ) {
    const date = new Date(
      year,
      monthNumber - 1,
      day
    );

    const dayOfWeek = date.getDay();

    if (
      dayOfWeek >= 1 &&
      dayOfWeek <= 6
    ) {
      workingDays++;
    }
  }

  return workingDays;
}

function getMonthRange(month: string) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  const startDate = `${year}-${String(
    monthNumber
  ).padStart(2, "0")}-01`;

  const nextMonth =
    monthNumber === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(
          monthNumber + 1
        ).padStart(2, "0")}-01`;

  return {
    startDate,
    nextMonth,
  };
}

function getErrorMessage(error: unknown) {
  if (!error) {
    return "Unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const item =
      error as Record<string, unknown>;

    return String(
      item.message ||
        item.details ||
        item.hint ||
        "Supabase error"
    );
  }

  return "Terjadi kesalahan.";
}

/* =========================================================
   PRODUCT ICON
========================================================= */

function ProductIcon({
  code,
}: {
  code: string;
}) {
  let iconClass =
    "bg-slate-100 text-slate-600";

  if (code === "POCARI_ALL") {
    iconClass =
      "bg-blue-50 text-blue-600";
  }

  if (code === "ION_ALL") {
    iconClass =
      "bg-cyan-50 text-cyan-600";
  }

  if (code === "SOYJOY") {
    iconClass =
      "bg-amber-50 text-amber-600";
  }

  if (code === "FIBE") {
    iconClass =
      "bg-emerald-50 text-emerald-600";
  }

  if (code === "ORONAMIN") {
    iconClass =
      "bg-orange-50 text-orange-600";
  }

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
    >
      <Package
        size={20}
        strokeWidth={1.8}
      />
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function TargetPage() {
  /* =======================================================
     STATE
  ======================================================= */

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [products, setProducts] =
    useState<Product[]>([]);

  const [targets, setTargets] =
    useState<MonthlyTarget[]>([]);

  /*
   * ACTUAL SEKARANG DARI daily_values
   * BUKAN transactions
   */
  const [dailyValues, setDailyValues] =
    useState<DailyValue[]>([]);

  const [targetInputs, setTargetInputs] =
    useState<Record<string, string>>({});

  const [workingDays, setWorkingDays] =
    useState(
      getWorkingDaysInMonth(
        getCurrentMonth()
      )
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showEditor, setShowEditor] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts =
    useCallback(async () => {
      const {
        data,
        error,
      } = await supabase
        .from("products")
        .select(
          "id, code, name, icon, active"
        )
        .eq("active", true);

      if (error) {
        throw error;
      }

      const sorted =
        ((data || []) as Product[])
          .filter((product) =>
            PRODUCT_ORDER.includes(
              product.code
            )
          )
          .sort(
            (a, b) =>
              PRODUCT_ORDER.indexOf(
                a.code
              ) -
              PRODUCT_ORDER.indexOf(
                b.code
              )
          );

      setProducts(sorted);
    }, []);

  /* =======================================================
     LOAD TARGET
  ======================================================= */

  const loadTargets =
    useCallback(async () => {
      const monthDate =
        `${selectedMonth}-01`;

      const {
        data,
        error,
      } = await supabase
        .from("monthly_targets")
        .select(
          "id, product_id, month, target_value, working_days"
        )
        .eq(
          "month",
          monthDate
        );

      if (error) {
        throw error;
      }

      const result =
        (data || []) as MonthlyTarget[];

      setTargets(result);

      const inputs: Record<
        string,
        string
      > = {};

      products.forEach((product) => {
        const row =
          result.find(
            (item) =>
              item.product_id ===
              product.id
          );

        inputs[product.id] =
          row
            ? String(
                Number(
                  row.target_value || 0
                )
              )
            : "";
      });

      setTargetInputs(inputs);

      /*
       * Ambil working days dari database
       * jika sudah ada.
       */
      const firstTarget =
        result[0];

      if (
        firstTarget &&
        Number(
          firstTarget.working_days
        ) > 0
      ) {
        setWorkingDays(
          Number(
            firstTarget.working_days
          )
        );
      } else {
        setWorkingDays(
          getWorkingDaysInMonth(
            selectedMonth
          )
        );
      }
    }, [
      products,
      selectedMonth,
    ]);

  /* =======================================================
     LOAD VALUE DARI HALAMAN VALUE
     
     DATABASE:
       daily_values
       id
       product_id
       date
       value

     Actual Target = SUM(value)
     berdasarkan product_id
     dan bulan yang dipilih.
  ======================================================= */

  const loadDailyValues =
    useCallback(async () => {
      const {
        startDate,
        nextMonth,
      } =
        getMonthRange(
          selectedMonth
        );

      const {
        data,
        error,
      } = await supabase
        .from("daily_values")
        .select(
          "id, product_id, date, value"
        )
        .gte(
          "date",
          startDate
        )
        .lt(
          "date",
          nextMonth
        )
        .order(
          "date",
          {
            ascending: true,
          }
        );

      if (error) {
        throw error;
      }

      setDailyValues(
        (data || []) as DailyValue[]
      );
    }, [
      selectedMonth,
    ]);

  /* =======================================================
     LOAD ALL
  ======================================================= */

  const loadAll =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        /*
         * Produk dulu karena targetInputs
         * membutuhkan daftar product.
         */
        await loadProducts();
      } catch (err) {
        console.error(
          "LOAD PRODUCTS ERROR:",
          getErrorMessage(err)
        );

        setError(
          `Gagal mengambil produk: ${getErrorMessage(
            err
          )}`
        );

        setLoading(false);
      }
    }, [
      loadProducts,
    ]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* =======================================================
     LOAD TARGET + VALUE
  ======================================================= */

  useEffect(() => {
    if (!products.length) {
      return;
    }

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        await Promise.all([
          loadTargets(),
          loadDailyValues(),
        ]);
      } catch (err) {
        console.error(
          "LOAD TARGET PAGE ERROR:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [
    products,
    selectedMonth,
    loadTargets,
    loadDailyValues,
  ]);

  /* =======================================================
     MONTH CHANGE
  ======================================================= */

  function changeMonth(
    direction: "prev" | "next"
  ) {
    const newMonth =
      direction === "prev"
        ? getPreviousMonth(
            selectedMonth
          )
        : getNextMonth(
            selectedMonth
          );

    setSelectedMonth(
      newMonth
    );

    setShowEditor(false);
    setMessage("");
    setError("");
  }

  /* =======================================================
     TARGET VALUE
  ======================================================= */

  function getTargetValue(
    productId: string
  ) {
    return Number(
      targetInputs[productId] || 0
    );
  }

  /* =======================================================
     ACTUAL VALUE
     
     SUM DARI daily_values
     
     Ini yang membuat halaman Target
     otomatis mengikuti halaman Value.
  ======================================================= */

  function getActual(
    productId: string
  ) {
    return dailyValues
      .filter(
        (item) =>
          item.product_id ===
          productId
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.value || 0
          ),
        0
      );
  }

  /* =======================================================
     TOTAL TARGET
  ======================================================= */

  const totalTarget =
    useMemo(() => {
      return products.reduce(
        (sum, product) =>
          sum +
          getTargetValue(
            product.id
          ),
        0
      );
    }, [
      products,
      targetInputs,
    ]);

  /* =======================================================
     TOTAL ACTUAL
     
     DARI daily_values
  ======================================================= */

  const totalActual =
    useMemo(() => {
      return dailyValues.reduce(
        (sum, item) =>
          sum +
          Number(
            item.value || 0
          ),
        0
      );
    }, [
      dailyValues,
    ]);

  /* =======================================================
     DAILY TARGET
  ======================================================= */

  const totalDailyTarget =
    workingDays > 0
      ? totalTarget /
        workingDays
      : 0;

  /* =======================================================
     ACHIEVEMENT
  ======================================================= */

  const achievement =
    totalTarget > 0
      ? (totalActual /
          totalTarget) *
        100
      : 0;

  /* =======================================================
     GAP
  ======================================================= */

  const totalGap =
    totalTarget -
    totalActual;

  /* =======================================================
     TOTAL VALUE DAYS
     
     Berapa hari sudah ada input
     dari halaman Value.
  ======================================================= */

  const inputDays =
    useMemo(() => {
      return new Set(
        dailyValues.map(
          (item) =>
            item.date
        )
      ).size;
    }, [
      dailyValues,
    ]);

  /* =======================================================
     SAVE TARGET
  ======================================================= */

  async function saveTargets() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!products.length) {
        throw new Error(
          "Produk belum tersedia."
        );
      }

      if (
        !workingDays ||
        workingDays <= 0
      ) {
        throw new Error(
          "Hari kerja harus lebih dari 0."
        );
      }

      const monthDate =
        `${selectedMonth}-01`;

      /*
       * Simpan SATU PER SATU agar aman
       * dengan struktur database sekarang.
       *
       * TIDAK mengirim daily_target.
       */
      for (
        const product of products
      ) {
        const targetValue =
          Number(
            targetInputs[
              product.id
            ] || 0
          );

        const {
          data: existing,
          error: findError,
        } = await supabase
          .from(
            "monthly_targets"
          )
          .select("id")
          .eq(
            "product_id",
            product.id
          )
          .eq(
            "month",
            monthDate
          )
          .maybeSingle();

        if (findError) {
          throw findError;
        }

        if (existing?.id) {
          const {
            error:
              updateError,
          } = await supabase
            .from(
              "monthly_targets"
            )
            .update({
              target_value:
                targetValue,
              working_days:
                workingDays,
            })
            .eq(
              "id",
              existing.id
            );

          if (updateError) {
            throw new Error(
              `${product.name}: ${getErrorMessage(
                updateError
              )}`
            );
          }
        } else {
          const {
            error:
              insertError,
          } = await supabase
            .from(
              "monthly_targets"
            )
            .insert({
              product_id:
                product.id,
              month:
                monthDate,
              target_value:
                targetValue,
              working_days:
                workingDays,
            });

          if (insertError) {
            throw new Error(
              `${product.name}: ${getErrorMessage(
                insertError
              )}`
            );
          }
        }
      }

      /*
       * Reload target setelah save.
       */
      await loadTargets();

      setShowEditor(false);

      setMessage(
        `Target ${formatMonth(
          selectedMonth
        )} berhasil disimpan.`
      );
    } catch (err) {
      console.error(
        "SAVE TARGET ERROR:",
        err
      );

      setError(
        `Gagal menyimpan target: ${getErrorMessage(
          err
        )}`
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar />

      {/* =====================================================
          MAIN

          PENTING:
          pakai padding-left, bukan margin-left.
          Ini supaya content tidak tertutup Sidebar.
      ====================================================== */}

      <main
        className="
          min-h-screen
          w-full
          lg:pl-[256px]
        "
      >
        <Header />

        <div
          className="
            w-full
            px-4
            py-5
            sm:px-6
            lg:px-8
          "
        >
          <div className="mx-auto w-full max-w-[1500px]">
            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <Target
                      size={21}
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                      Target
                    </h1>

                    <p className="text-sm text-slate-500">
                      Target value
                      dan pencapaian
                      berdasarkan data
                      dari halaman Value.
                    </p>
                  </div>
                </div>
              </div>

              {/* MONTH CONTROL */}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    changeMonth(
                      "prev"
                    )
                  }
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    text-slate-600
                    transition
                    hover:bg-slate-50
                  "
                >
                  <ChevronLeft
                    size={18}
                  />
                </button>

                <div
                  className="
                    flex
                    h-10
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                  "
                >
                  <CalendarDays
                    size={16}
                    className="text-slate-400"
                  />

                  <input
                    type="month"
                    value={
                      selectedMonth
                    }
                    onChange={(e) =>
                      setSelectedMonth(
                        e.target.value
                      )
                    }
                    className="
                      border-0
                      bg-transparent
                      text-sm
                      font-semibold
                      text-slate-700
                      outline-none
                    "
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    changeMonth(
                      "next"
                    )
                  }
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    text-slate-600
                    transition
                    hover:bg-slate-50
                  "
                >
                  <ChevronRight
                    size={18}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowEditor(
                      !showEditor
                    )
                  }
                  className="
                    inline-flex
                    h-10
                    items-center
                    gap-2
                    rounded-lg
                    bg-slate-900
                    px-4
                    text-sm
                    font-bold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-slate-800
                  "
                >
                  <Pencil
                    size={16}
                  />

                  {showEditor
                    ? "Tutup Editor"
                    : "Edit Target"}
                </button>
              </div>
            </div>

            {/* =================================================
                ALERT SUCCESS
            ================================================= */}

            {message && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <CheckCircle2
                  size={18}
                />

                <span className="flex-1">
                  {message}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setMessage("")
                  }
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* =================================================
                ALERT ERROR
            ================================================= */}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span className="flex-1">
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
                <RefreshCw
                  size={28}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-4 text-sm font-semibold text-slate-600">
                  Memuat data
                  Target dan
                  Value...
                </p>
              </div>
            ) : products.length ===
              0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="text-amber-600"
                    size={22}
                  />

                  <div>
                    <h2 className="font-bold text-amber-800">
                      Produk belum
                      ditemukan
                    </h2>

                    <p className="mt-1 text-sm text-amber-700">
                      Pastikan tabel
                      products memiliki
                      produk aktif
                      dengan code:
                      POCARI_ALL,
                      ION_ALL,
                      SOYJOY, FIBE,
                      atau ORONAMIN.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:grid-cols-4">
                  {/* TARGET */}

                  <div className="border-b border-r border-slate-100 p-5 xl:border-b-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Target Bulanan
                    </div>

                    <div className="mt-2 text-xl font-black text-slate-900">
                      {formatShort(
                        totalTarget
                      )}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      {formatRupiah(
                        totalTarget
                      )}
                    </div>
                  </div>

                  {/* ACTUAL VALUE */}

                  <div className="border-b border-slate-100 p-5 xl:border-b-0 xl:border-r">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Actual Value
                    </div>

                    <div className="mt-2 text-xl font-black text-slate-900">
                      {formatShort(
                        totalActual
                      )}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      Dari halaman
                      Value
                    </div>
                  </div>

                  {/* ACHIEVEMENT */}

                  <div className="border-r border-slate-100 p-5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Achievement
                    </div>

                    <div
                      className={`mt-2 text-xl font-black ${
                        achievement >=
                        100
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

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${Math.min(
                            achievement,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* GAP */}

                  <div className="p-5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      GAP
                    </div>

                    <div
                      className={`mt-2 text-xl font-black ${
                        totalGap > 0
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {totalGap >
                      0
                        ? "-"
                        : "+"}

                      {formatShort(
                        Math.abs(
                          totalGap
                        )
                      )}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      {totalGap >
                      0
                        ? "Belum tercapai"
                        : "Target tercapai"}
                    </div>
                  </div>
                </div>

                {/* =================================================
                    VALUE CONNECTION INFO
                ================================================= */}

                <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <TrendingUp
                        size={18}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-bold text-blue-900">
                        Actual tersambung
                        ke halaman Value
                      </div>

                      <div className="text-xs text-blue-700/70">
                        Data dihitung dari
                        tabel daily_values
                        periode{" "}
                        {formatMonth(
                          selectedMonth
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-blue-700">
                    {inputDays} hari
                    input
                  </div>
                </div>

                {/* =================================================
                    EDITOR
                ================================================= */}

                {showEditor && (
                  <section className="mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                    <div className="border-b border-blue-100 bg-blue-50/60 px-5 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="font-black text-slate-900">
                            Pengaturan
                            Target
                          </h2>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatMonth(
                              selectedMonth
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">
                            Hari kerja
                          </span>

                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={
                              workingDays
                            }
                            onChange={(e) =>
                              setWorkingDays(
                                Math.max(
                                  1,
                                  Number(
                                    e
                                      .target
                                      .value
                                  ) ||
                                    1
                                )
                              )
                            }
                            className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-bold outline-none focus:border-blue-500"
                          />

                          <span className="text-xs text-slate-400">
                            Senin–Sabtu
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                      {products.map(
                        (product) => {
                          const target =
                            getTargetValue(
                              product.id
                            );

                          const daily =
                            workingDays >
                            0
                              ? target /
                                workingDays
                              : 0;

                          return (
                            <div
                              key={
                                product.id
                              }
                              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                            >
                              <div className="flex items-center gap-3">
                                <ProductIcon
                                  code={
                                    product.code
                                  }
                                />

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-bold text-slate-800">
                                    {
                                      product.name
                                    }
                                  </div>

                                  <div className="mt-0.5 text-[10px] text-slate-400">
                                    {
                                      product.code
                                    }
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4">
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Target
                                  Bulanan
                                </label>

                                <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-blue-500">
                                  <span className="flex items-center px-3 text-xs text-slate-400">
                                    Rp
                                  </span>

                                  <input
                                    type="number"
                                    min={0}
                                    value={
                                      targetInputs[
                                        product
                                          .id
                                      ] ||
                                      ""
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setTargetInputs(
                                        (
                                          previous
                                        ) => ({
                                          ...previous,
                                          [product.id]:
                                            e
                                              .target
                                              .value,
                                        })
                                      )
                                    }
                                    placeholder="0"
                                    className="w-full border-0 px-2 py-2.5 text-sm font-bold outline-none"
                                  />
                                </div>

                                <div className="mt-2 flex justify-between text-xs">
                                  <span className="text-slate-400">
                                    Target /
                                    hari
                                  </span>

                                  <span className="font-bold text-slate-700">
                                    {formatRupiah(
                                      daily
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-400">
                        Target harian =
                        target bulanan ÷
                        hari kerja.
                      </p>

                      <button
                        type="button"
                        onClick={
                          saveTargets
                        }
                        disabled={
                          saving
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? (
                          <RefreshCw
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Save
                            size={15}
                          />
                        )}

                        {saving
                          ? "Menyimpan..."
                          : "Simpan Target"}
                      </button>
                    </div>
                  </section>
                )}

                {/* =================================================
                    TABLE
                ================================================= */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-black text-slate-900">
                        Target Produk
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Actual otomatis
                        mengikuti
                        halaman Value
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CalendarDays
                        size={14}
                      />

                      <span>
                        {formatMonth(
                          selectedMonth
                        )}
                      </span>

                      <span>
                        •
                      </span>

                      <span>
                        {
                          workingDays
                        }{" "}
                        hari kerja
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Produk
                          </th>

                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Target
                          </th>

                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            / Hari
                          </th>

                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Actual Value
                          </th>

                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Achievement
                          </th>

                          <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            GAP
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {products.map(
                          (product) => {
                            const target =
                              getTargetValue(
                                product.id
                              );

                            /*
                             * ACTUAL DARI daily_values
                             */
                            const actual =
                              getActual(
                                product.id
                              );

                            const daily =
                              workingDays >
                              0
                                ? target /
                                  workingDays
                                : 0;

                            const percentage =
                              target >
                              0
                                ? (actual /
                                    target) *
                                  100
                                : 0;

                            const gap =
                              target -
                              actual;

                            return (
                              <tr
                                key={
                                  product.id
                                }
                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                              >
                                {/* PRODUCT */}

                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <ProductIcon
                                      code={
                                        product.code
                                      }
                                    />

                                    <div>
                                      <div className="text-sm font-bold text-slate-800">
                                        {
                                          product.name
                                        }
                                      </div>

                                      <div className="mt-0.5 text-[10px] text-slate-400">
                                        {
                                          product.code
                                        }
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* TARGET */}

                                <td className="px-4 py-4 text-right">
                                  <span className="text-sm font-bold text-slate-800">
                                    {formatShort(
                                      target
                                    )}
                                  </span>
                                </td>

                                {/* DAILY */}

                                <td className="px-4 py-4 text-right">
                                  <span className="text-xs font-semibold text-slate-500">
                                    {formatShort(
                                      daily
                                    )}
                                  </span>
                                </td>

                                {/* ACTUAL */}

                                <td className="px-4 py-4 text-right">
                                  <span className="text-sm font-bold text-slate-800">
                                    {formatShort(
                                      actual
                                    )}
                                  </span>

                                  <div className="mt-0.5 text-[10px] text-slate-400">
                                    Value
                                  </div>
                                </td>

                                {/* ACHIEVEMENT */}

                                <td className="px-4 py-4">
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="hidden w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          percentage >=
                                          100
                                            ? "bg-emerald-500"
                                            : percentage >=
                                              80
                                            ? "bg-amber-400"
                                            : "bg-blue-500"
                                        }`}
                                        style={{
                                          width: `${Math.min(
                                            percentage,
                                            100
                                          )}%`,
                                        }}
                                      />
                                    </div>

                                    <span
                                      className={`text-xs font-black ${
                                        percentage >=
                                        100
                                          ? "text-emerald-600"
                                          : percentage >=
                                            80
                                          ? "text-amber-600"
                                          : "text-blue-600"
                                      }`}
                                    >
                                      {percentage.toFixed(
                                        1
                                      )}
                                      %
                                    </span>
                                  </div>
                                </td>

                                {/* GAP */}

                                <td className="px-5 py-4 text-right">
                                  <span
                                    className={`text-sm font-bold ${
                                      gap >
                                      0
                                        ? "text-red-600"
                                        : "text-emerald-600"
                                    }`}
                                  >
                                    {gap >
                                    0
                                      ? "-"
                                      : "+"}

                                    {formatShort(
                                      Math.abs(
                                        gap
                                      )
                                    )}
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>

                      {/* TOTAL */}

                      <tfoot>
                        <tr className="border-t border-slate-200 bg-slate-50">
                          <td className="px-5 py-4 text-sm font-black text-slate-900">
                            TOTAL
                          </td>

                          <td className="px-4 py-4 text-right text-sm font-black text-slate-900">
                            {formatShort(
                              totalTarget
                            )}
                          </td>

                          <td className="px-4 py-4 text-right text-xs font-bold text-slate-500">
                            {formatShort(
                              totalDailyTarget
                            )}
                          </td>

                          <td className="px-4 py-4 text-right text-sm font-black text-slate-900">
                            {formatShort(
                              totalActual
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <span
                              className={`text-sm font-black ${
                                achievement >=
                                100
                                  ? "text-emerald-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {achievement.toFixed(
                                1
                              )}
                              %
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span
                              className={`text-sm font-black ${
                                totalGap >
                                0
                                  ? "text-red-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {totalGap >
                              0
                                ? "-"
                                : "+"}

                              {formatShort(
                                Math.abs(
                                  totalGap
                                )
                              )}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>

                {/* =================================================
                    INFO
                ================================================= */}

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {/* WORKING DAYS */}

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <CalendarDays
                          size={18}
                        />
                      </div>

                      <div>
                        <div className="text-xs text-slate-400">
                          Hari Kerja
                        </div>

                        <div className="text-sm font-black text-slate-800">
                          {
                            workingDays
                          }{" "}
                          hari
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Hari kerja dihitung
                      Senin sampai
                      Sabtu. Minggu
                      tidak dihitung.
                    </p>
                  </div>

                  {/* DAILY TARGET */}

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <TrendingUp
                          size={18}
                        />
                      </div>

                      <div>
                        <div className="text-xs text-slate-400">
                          Target / Hari
                        </div>

                        <div className="text-sm font-black text-slate-800">
                          {formatShort(
                            totalDailyTarget
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Total target bulanan
                      dibagi jumlah
                      hari kerja.
                    </p>
                  </div>

                  {/* VALUE DATA */}

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                        <Package
                          size={18}
                        />
                      </div>

                      <div>
                        <div className="text-xs text-slate-400">
                          Data Value
                        </div>

                        <div className="text-sm font-black text-slate-800">
                          {
                            dailyValues.length
                          }{" "}
                          record
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Actual diambil
                      langsung dari
                      tabel{" "}
                      <span className="font-semibold text-slate-600">
                        daily_values
                      </span>{" "}
                      yang digunakan
                      halaman Value.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}