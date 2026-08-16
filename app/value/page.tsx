"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";

import {
  Package,
  ChevronDown,
  ChevronUp,
  Cookie,
  Droplets,
  Leaf,
  Pencil,
  Plus,
  Save,
  TrendingUp,
  Zap,
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
  daily_target?: number;
};

type DailyValue = {
  id: string;
  product_id: string;
  date: string;
  value: number;
};

/* =========================================================
   PRODUCT CODES
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
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
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
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getToday() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
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
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

/* =========================================================
   SUPABASE ERROR HELPER
========================================================= */

function getSupabaseErrorMessage(error: unknown) {
  if (!error) {
    return "Terjadi kesalahan database.";
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

    try {
      return JSON.stringify(error);
    } catch {
      return "Terjadi kesalahan database.";
    }
  }

  return "Terjadi kesalahan database.";
}

function logSupabaseError(
  label: string,
  error: unknown
) {
  console.error(label);

  if (error instanceof Error) {
    console.error("message:", error.message);
    console.error("stack:", error.stack);
    return;
  }

  if (typeof error === "object" && error !== null) {
    const supabaseError =
      error as Record<string, unknown>;

    console.error(
      "message:",
      supabaseError.message
    );

    console.error(
      "details:",
      supabaseError.details
    );

    console.error(
      "hint:",
      supabaseError.hint
    );

    console.error(
      "code:",
      supabaseError.code
    );

    return;
  }

  console.error("error:", error);
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
   PAGE
========================================================= */

export default function ValuePage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  /* =======================================================
     STATE
  ======================================================= */

  const [products, setProducts] =
    useState<Product[]>([]);

  const [targets, setTargets] =
    useState<MonthlyTarget[]>([]);

  const [dailyValues, setDailyValues] =
    useState<DailyValue[]>([]);

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [workingDays, setWorkingDays] =
    useState(24);

  const [targetInputs, setTargetInputs] =
    useState<Record<string, string>>({});

  const [dailyInputs, setDailyInputs] =
    useState<Record<string, string>>({});

  const [updateDate, setUpdateDate] =
    useState(getToday());

  const [showTargetEditor, setShowTargetEditor] =
    useState(false);

  const [showDailyEditor, setShowDailyEditor] =
    useState(false);

  const [expandedDate, setExpandedDate] =
    useState<string | null>(null);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [loadingData, setLoadingData] =
    useState(false);

  const [savingTarget, setSavingTarget] =
    useState(false);

  const [savingDaily, setSavingDaily] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts = useCallback(
    async () => {
      setLoadingProducts(true);
      setError("");

      const {
        data,
        error: productError,
      } = await supabase
        .from("products")
        .select(
          "id, code, name, icon, active"
        )
        .in(
          "code",
          VALUE_PRODUCT_CODES
        )
        .eq("active", true);

      if (productError) {
        logSupabaseError(
          "PRODUCT ERROR",
          productError
        );

        setError(
          getSupabaseErrorMessage(
            productError
          )
        );

        setLoadingProducts(false);
        return;
      }

      const sorted =
        ((data || []) as Product[]).sort(
          (a, b) =>
            VALUE_PRODUCT_CODES.indexOf(
              a.code
            ) -
            VALUE_PRODUCT_CODES.indexOf(
              b.code
            )
        );

      setProducts(sorted);
      setLoadingProducts(false);
    },
    [supabase]
  );

  /* =======================================================
     LOAD TARGETS
  ======================================================= */

  const loadTargets = useCallback(
    async () => {
      if (!products.length) {
        return;
      }

      const monthDate =
        `${selectedMonth}-01`;

      const {
        data,
        error: targetError,
      } = await supabase
        .from("monthly_targets")
        .select("*")
        .eq("month", monthDate);

      if (targetError) {
        logSupabaseError(
          "LOAD TARGET ERROR",
          targetError
        );

        setError(
          getSupabaseErrorMessage(
            targetError
          )
        );

        return;
      }

      const productIds =
        products.map(
          (product) => product.id
        );

      const filtered =
        ((data || []) as MonthlyTarget[]).filter(
          (row) =>
            productIds.includes(
              row.product_id
            )
        );

      setTargets(filtered);

      if (filtered.length > 0) {
        const firstWorkingDays =
          Number(
            filtered[0].working_days
          );

        if (
          Number.isFinite(
            firstWorkingDays
          ) &&
          firstWorkingDays > 0
        ) {
          setWorkingDays(
            firstWorkingDays
          );
        }
      }

      const inputs: Record<
        string,
        string
      > = {};

      products.forEach((product) => {
        const row = filtered.find(
          (target) =>
            target.product_id ===
            product.id
        );

        inputs[product.id] =
          row &&
          Number.isFinite(
            Number(
              row.target_value
            )
          )
            ? String(
                Number(
                  row.target_value
                )
              )
            : "";
      });

      setTargetInputs(inputs);
    },
    [
      supabase,
      products,
      selectedMonth,
    ]
  );

  /* =======================================================
     LOAD DAILY VALUES
  ======================================================= */

  const loadDailyValues =
    useCallback(async () => {
      if (!products.length) {
        return;
      }

      const startDate =
        `${selectedMonth}-01`;

      const [
        yearString,
        monthString,
      ] = selectedMonth.split("-");

      const year =
        Number(yearString);

      const month =
        Number(monthString);

      const nextMonth =
        month === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(
              month + 1
            ).padStart(2, "0")}-01`;

      const {
        data,
        error: dailyError,
      } = await supabase
        .from("daily_values")
        .select("*")
        .gte(
          "date",
          startDate
        )
        .lt(
          "date",
          nextMonth
        )
        .order("date", {
          ascending: false,
        });

      if (dailyError) {
        logSupabaseError(
          "LOAD DAILY VALUE ERROR",
          dailyError
        );

        setError(
          getSupabaseErrorMessage(
            dailyError
          )
        );

        return;
      }

      const productIds =
        products.map(
          (product) => product.id
        );

      const filtered =
        ((data || []) as DailyValue[]).filter(
          (row) =>
            productIds.includes(
              row.product_id
            )
        );

      setDailyValues(filtered);
    }, [
      supabase,
      products,
      selectedMonth,
    ]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  /* =======================================================
     LOAD DATA AFTER PRODUCTS
  ======================================================= */

  useEffect(() => {
    if (!products.length) {
      return;
    }

    async function load() {
      setLoadingData(true);

      await Promise.all([
        loadTargets(),
        loadDailyValues(),
      ]);

      setLoadingData(false);
    }

    void load();
  }, [
    products,
    selectedMonth,
    loadTargets,
    loadDailyValues,
  ]);

  /* =======================================================
     TARGET HELPER
  ======================================================= */

  function getTarget(
    productId: string
  ) {
    return targets.find(
      (target) =>
        target.product_id ===
        productId
    );
  }

  /* =======================================================
     ACTUAL HELPER
  ======================================================= */

  function getActual(
    productId: string
  ) {
    return dailyValues
      .filter(
        (row) =>
          row.product_id ===
          productId
      )
      .reduce(
        (sum, row) =>
          sum +
          Number(row.value || 0),
        0
      );
  }

  /* =======================================================
     TOTAL TARGET
  ======================================================= */

  const totalTarget =
    useMemo(() => {
      return products.reduce(
        (total, product) =>
          total +
          Number(
            targetInputs[
              product.id
            ] || 0
          ),
        0
      );
    }, [
      products,
      targetInputs,
    ]);

  /* =======================================================
     TOTAL ACTUAL
  ======================================================= */

  const totalActual =
    useMemo(() => {
      return dailyValues.reduce(
        (total, row) =>
          total +
          Number(row.value || 0),
        0
      );
    }, [dailyValues]);

  /* =======================================================
     DAILY TARGET
  ======================================================= */

  const totalDailyTarget =
    workingDays > 0
      ? totalTarget /
        workingDays
      : 0;

  /* =======================================================
     TOTAL PERCENTAGE
  ======================================================= */

  const totalPercentage =
    totalTarget > 0
      ? (totalActual /
          totalTarget) *
        100
      : 0;

  /* =======================================================
     TOTAL GAP
  ======================================================= */

  const totalGap =
    totalTarget -
    totalActual;

  /* =======================================================
     HISTORY
  ======================================================= */

  const history =
    useMemo(() => {
      const grouped: Record<
        string,
        DailyValue[]
      > = {};

      dailyValues.forEach(
        (row) => {
          if (!grouped[row.date]) {
            grouped[row.date] = [];
          }

          grouped[row.date].push(
            row
          );
        }
      );

      return Object.entries(
        grouped
      )
        .map(
          ([date, rows]) => {
            const total =
              rows.reduce(
                (sum, row) =>
                  sum +
                  Number(
                    row.value || 0
                  ),
                0
              );

            const percentage =
              totalDailyTarget > 0
                ? (total /
                    totalDailyTarget) *
                  100
                : 0;

            const gap =
              totalDailyTarget -
              total;

            return {
              date,
              rows,
              total,
              percentage,
              gap,
            };
          }
        )
        .sort((a, b) =>
          b.date.localeCompare(
            a.date
          )
        );
    }, [
      dailyValues,
      totalDailyTarget,
    ]);

  /* =======================================================
     SAVE TARGET
     
     IMPORTANT:
     daily_target TIDAK dikirim.
     
     Database yang menangani daily_target.
  ======================================================= */

  async function saveTargets() {
    if (savingTarget) {
      return;
    }

    setSavingTarget(true);
    setError("");
    setMessage("");

    try {
      if (!products.length) {
        throw new Error(
          "Produk Value belum tersedia."
        );
      }

      if (!selectedMonth) {
        throw new Error(
          "Bulan belum dipilih."
        );
      }

      if (
        !Number.isFinite(
          Number(workingDays)
        ) ||
        Number(workingDays) <= 0
      ) {
        throw new Error(
          "Hari kerja harus lebih dari 0."
        );
      }

      const monthDate =
        `${selectedMonth}-01`;

      /*
       * VALIDASI SEMUA DATA TERLEBIH DAHULU
       */

      const rows = products.map(
        (product) => {
          const rawValue =
            targetInputs[
              product.id
            ] ?? "";

          const targetValue =
            rawValue === ""
              ? 0
              : Number(rawValue);

          if (
            !Number.isFinite(
              targetValue
            ) ||
            targetValue < 0
          ) {
            throw new Error(
              `Target ${product.name} tidak valid.`
            );
          }

          /*
           * JANGAN TAMBAHKAN:
           *
           * daily_target
           *
           * karena kolom tersebut
           * ditangani database.
           */

          return {
            product_id:
              product.id,

            month:
              monthDate,

            target_value:
              targetValue,

            working_days:
              Number(
                workingDays
              ),
          };
        }
      );

      /*
       * SIMPAN SATU PER SATU
       *
       * Dengan cara ini kalau ada error,
       * produk yang bermasalah dapat diketahui.
       */

      for (const row of rows) {
        const product =
          products.find(
            (item) =>
              item.id ===
              row.product_id
          );

        if (!product) {
          continue;
        }

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
            row.product_id
          )
          .eq(
            "month",
            monthDate
          )
          .maybeSingle();

        if (findError) {
          logSupabaseError(
            `CHECK TARGET ERROR - ${product.code}`,
            findError
          );

          throw new Error(
            `Gagal mengecek target ${product.name}: ${getSupabaseErrorMessage(
              findError
            )}`
          );
        }

        /*
         * Kalau data sudah ada:
         * UPDATE hanya kolom yang diperlukan.
         */

        if (existing?.id) {
          const {
            error: updateError,
          } = await supabase
            .from(
              "monthly_targets"
            )
            .update({
              target_value:
                row.target_value,

              working_days:
                row.working_days,
            })
            .eq(
              "id",
              existing.id
            );

          if (updateError) {
            logSupabaseError(
              `UPDATE TARGET ERROR - ${product.code}`,
              updateError
            );

            throw new Error(
              `Gagal menyimpan target ${product.name}: ${getSupabaseErrorMessage(
                updateError
              )}`
            );
          }
        } else {
          /*
           * INSERT BARU
           *
           * Tidak mengirim daily_target.
           */

          const {
            error: insertError,
          } = await supabase
            .from(
              "monthly_targets"
            )
            .insert({
              product_id:
                row.product_id,

              month:
                row.month,

              target_value:
                row.target_value,

              working_days:
                row.working_days,
            });

          if (insertError) {
            logSupabaseError(
              `INSERT TARGET ERROR - ${product.code}`,
              insertError
            );

            throw new Error(
              `Gagal menyimpan target ${product.name}: ${getSupabaseErrorMessage(
                insertError
              )}`
            );
          }
        }
      }

      /*
       * REFRESH DATA
       */

      await loadTargets();

      setShowTargetEditor(false);

      setMessage(
        `Target ${formatMonth(
          selectedMonth
        )} berhasil disimpan.`
      );
    } catch (err: unknown) {
      logSupabaseError(
        "SAVE TARGET ERROR",
        err
      );

      setError(
        getSupabaseErrorMessage(
          err
        )
      );
    } finally {
      setSavingTarget(false);
    }
  }

  /* =======================================================
     SAVE DAILY
  ======================================================= */

  async function saveDailyUpdate() {
    if (savingDaily) {
      return;
    }

    setSavingDaily(true);
    setError("");
    setMessage("");

    try {
      if (!updateDate) {
        throw new Error(
          "Tanggal belum dipilih."
        );
      }

      const rows =
        products
          .filter((product) => {
            const value =
              dailyInputs[
                product.id
              ];

            return (
              value !== undefined &&
              value !== ""
            );
          })
          .map((product) => {
            const value =
              Number(
                dailyInputs[
                  product.id
                ] || 0
              );

            if (
              !Number.isFinite(
                value
              ) ||
              value < 0
            ) {
              throw new Error(
                `Value ${product.name} tidak valid.`
              );
            }

            return {
              product_id:
                product.id,

              date: updateDate,

              value,
            };
          });

      if (!rows.length) {
        throw new Error(
          "Isi minimal satu value produk."
        );
      }

      /*
       * Gunakan upsert untuk daily_values.
       *
       * Pastikan database mempunyai unique:
       * product_id + date
       */

      const {
        error: saveError,
      } = await supabase
        .from("daily_values")
        .upsert(rows, {
          onConflict:
            "product_id,date",
        });

      if (saveError) {
        logSupabaseError(
          "SAVE DAILY ERROR",
          saveError
        );

        throw new Error(
          getSupabaseErrorMessage(
            saveError
          )
        );
      }

      await loadDailyValues();

      setDailyInputs({});

      setShowDailyEditor(false);

      setMessage(
        `Update harian ${formatDate(
          updateDate
        )} berhasil disimpan.`
      );
    } catch (err: unknown) {
      logSupabaseError(
        "SAVE DAILY ERROR",
        err
      );

      setError(
        getSupabaseErrorMessage(
          err
        )
      );
    } finally {
      setSavingDaily(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Sidebar />

      <div className="min-h-screen lg:ml-[256px]">
        <Header />

        <main className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
                Value
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Target dan pencapaian
                value bulanan
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              />

              <button
                onClick={() => {
                  setError("");
                  setMessage("");
                  setUpdateDate(
                    getToday()
                  );
                  setShowDailyEditor(
                    true
                  );
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Update Harian
              </button>
            </div>
          </div>

          {/* =================================================
              MESSAGE
          ================================================= */}

          {message && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <span>
                ✓ {message}
              </span>

              <button
                onClick={() =>
                  setMessage("")
                }
                className="ml-4"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">
                    Gagal
                  </div>

                  <div className="mt-1 break-words">
                    {error}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setError("")
                  }
                  className="shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              LOADING PRODUCTS
          ================================================= */}

          {loadingProducts ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <div className="text-sm text-slate-500">
                Mengambil produk
                dari database...
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
              <div className="font-semibold text-amber-800">
                Produk Value belum
                ditemukan.
              </div>

              <p className="mt-2 text-sm text-amber-700">
                Pastikan tabel
                products memiliki
                code:
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {VALUE_PRODUCT_CODES.map(
                  (code) => (
                    <span
                      key={code}
                      className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600"
                    >
                      {code}
                    </span>
                  )
                )}
              </div>
            </div>
          ) : (
            <>
              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-4">
                {/* TARGET */}

                <div className="border-b border-r border-slate-100 p-4 lg:border-b-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Target Bulanan
                  </div>

                  <div className="mt-1.5 text-xl font-bold text-slate-900">
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

                {/* ACTUAL */}

                <div className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Actual
                  </div>

                  <div className="mt-1.5 text-xl font-bold text-slate-900">
                    {formatShort(
                      totalActual
                    )}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {formatRupiah(
                      totalActual
                    )}
                  </div>
                </div>

                {/* ACHIEVEMENT */}

                <div className="border-r border-slate-100 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Achievement
                  </div>

                  <div
                    className={`mt-1.5 text-xl font-bold ${
                      totalPercentage >=
                      100
                        ? "text-emerald-600"
                        : totalPercentage >=
                          80
                        ? "text-amber-500"
                        : "text-blue-600"
                    }`}
                  >
                    {totalPercentage.toFixed(
                      1
                    )}
                    %
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        totalPercentage >=
                        100
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.max(
                            totalPercentage,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* GAP */}

                <div className="p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    GAP
                  </div>

                  <div
                    className={`mt-1.5 text-xl font-bold ${
                      totalGap > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {totalGap > 0
                      ? "-"
                      : "+"}
                    {formatShort(
                      Math.abs(
                        totalGap
                      )
                    )}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {totalGap > 0
                      ? "Belum tercapai"
                      : "Target tercapai"}
                  </div>
                </div>
              </div>

              {/* =================================================
                  TARGET SECTION
              ================================================= */}

              <section className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Target Value Produk
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatMonth(
                        selectedMonth
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Hari kerja
                      </div>

                      <div className="text-sm font-bold text-slate-700">
                        {
                          workingDays
                        }{" "}
                        hari
                      </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200" />

                    <div className="text-right">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Target / Hari
                      </div>

                      <div className="text-sm font-bold text-slate-700">
                        {formatShort(
                          totalDailyTarget
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setShowTargetEditor(
                          !showTargetEditor
                        )
                      }
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Pencil
                        size={14}
                      />

                      {showTargetEditor
                        ? "Tutup"
                        : "Edit"}
                    </button>
                  </div>
                </div>

                {/* =================================================
                    TARGET EDITOR
                ================================================= */}

                {showTargetEditor && (
                  <div className="border-b border-blue-100 bg-blue-50/40 p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          Pengaturan Target
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Masukkan target
                          bulanan setiap
                          produk.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">
                          Hari kerja
                        </label>

                        <input
                          type="number"
                          min={1}
                          value={
                            workingDays
                          }
                          onChange={(e) => {
                            const value =
                              Number(
                                e.target
                                  .value
                              );

                            setWorkingDays(
                              Number.isFinite(
                                value
                              ) &&
                                value >
                                  0
                                ? value
                                : 1
                            );
                          }}
                          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {products.map(
                        (product) => {
                          const target =
                            Number(
                              targetInputs[
                                product.id
                              ] || 0
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
                              className="rounded-xl border border-slate-200 bg-white p-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                  <ProductIcon
                                    code={
                                      product.code
                                    }
                                    size={
                                      21
                                    }
                                  />
                                </div>

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-800">
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
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Target Bulanan
                                </label>

                                <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-blue-500">
                                  <span className="px-3 text-xs text-slate-400">
                                    Rp
                                  </span>

                                  <input
                                    type="number"
                                    min={0}
                                    value={
                                      targetInputs[
                                        product.id
                                      ] ||
                                      ""
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setTargetInputs(
                                        (
                                          prev
                                        ) => ({
                                          ...prev,
                                          [product.id]:
                                            e
                                              .target
                                              .value,
                                        })
                                      )
                                    }
                                    className="w-full border-0 px-2 py-2.5 text-sm font-semibold outline-none"
                                    placeholder="0"
                                  />
                                </div>

                                <div className="mt-2 text-xs text-slate-400">
                                  Target/hari:

                                  <span className="ml-1 font-semibold text-slate-600">
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

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={
                          saveTargets
                        }
                        disabled={
                          savingTarget
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Save
                          size={15}
                        />

                        {savingTarget
                          ? "Menyimpan..."
                          : "Simpan Target"}
                      </button>
                    </div>
                  </div>
                )}

                {/* =================================================
                    TARGET TABLE
                ================================================= */}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Produk
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Target
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Actual
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          %
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          GAP
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {products.map(
                        (product) => {
                          const target =
                            Number(
                              targetInputs[
                                product.id
                              ] || 0
                            );

                          const actual =
                            getActual(
                              product.id
                            );

                          const percentage =
                            target > 0
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
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                    <ProductIcon
                                      code={
                                        product.code
                                      }
                                      size={
                                        18
                                      }
                                    />
                                  </div>

                                  <div>
                                    <div className="text-sm font-semibold text-slate-800">
                                      {
                                        product.name
                                      }
                                    </div>

                                    <div className="mt-0.5 text-[10px] text-slate-400">
                                      Target/hari{" "}
                                      {formatShort(
                                        workingDays >
                                          0
                                          ? target /
                                              workingDays
                                          : 0
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3.5 text-right">
                                <div className="text-sm font-semibold text-slate-800">
                                  {formatShort(
                                    target
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-3.5 text-right">
                                <div className="text-sm font-semibold text-slate-800">
                                  {formatShort(
                                    actual
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="hidden w-14 overflow-hidden rounded-full bg-slate-100 sm:block">
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
                                          Math.max(
                                            percentage,
                                            0
                                          ),
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>

                                  <span
                                    className={`text-xs font-bold ${
                                      percentage >=
                                      100
                                        ? "text-emerald-600"
                                        : percentage >=
                                          80
                                        ? "text-amber-600"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {percentage.toFixed(
                                      1
                                    )}
                                    %
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <span
                                  className={`text-sm font-semibold ${
                                    gap > 0
                                      ? "text-red-600"
                                      : "text-emerald-600"
                                  }`}
                                >
                                  {gap > 0
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
                  </table>
                </div>
              </section>

              {/* =================================================
                  HISTORY
              ================================================= */}

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      History Update
                      Harian
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatMonth(
                        selectedMonth
                      )}
                    </p>
                  </div>

                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    {
                      history.length
                    }{" "}
                    hari
                  </div>
                </div>

                {history.length ===
                0 ? (
                  <div className="px-5 py-12 text-center">
                    <TrendingUp
                      size={28}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      Belum ada update
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Data update harian
                      akan muncul di
                      sini.
                    </p>
                  </div>
                ) : (
                  <div>
                    {history.map(
                      (item) => {
                        const open =
                          expandedDate ===
                          item.date;

                        return (
                          <div
                            key={
                              item.date
                            }
                            className="border-b border-slate-100 last:border-0"
                          >
                            <button
                              onClick={() =>
                                setExpandedDate(
                                  open
                                    ? null
                                    : item.date
                                )
                              }
                              className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                            >
                              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100">
                                <span className="text-[9px] font-medium uppercase text-slate-400">
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
                                <div className="text-sm font-semibold text-slate-800">
                                  {formatDate(
                                    item.date
                                  )}
                                </div>

                                <div className="mt-0.5 text-xs text-slate-400">
                                  {
                                    item
                                      .rows
                                      .length
                                  }{" "}
                                  produk
                                </div>
                              </div>

                              <div className="hidden text-right sm:block">
                                <div className="text-sm font-bold text-slate-800">
                                  {formatShort(
                                    item.total
                                  )}
                                </div>

                                <div className="mt-0.5 text-[10px] text-slate-400">
                                  target/hari{" "}
                                  {formatShort(
                                    totalDailyTarget
                                  )}
                                </div>
                              </div>

                              <div
                                className={`min-w-[48px] text-right text-xs font-bold ${
                                  item.percentage >=
                                  100
                                    ? "text-emerald-600"
                                    : item.percentage >=
                                      80
                                    ? "text-amber-600"
                                    : "text-red-500"
                                }`}
                              >
                                {item.percentage.toFixed(
                                  0
                                )}
                                %
                              </div>

                              <div
                                className={`hidden min-w-[85px] text-right text-xs font-semibold md:block ${
                                  item.gap > 0
                                    ? "text-red-500"
                                    : "text-emerald-600"
                                }`}
                              >
                                {item.gap >
                                0
                                  ? "-"
                                  : "+"}

                                {formatShort(
                                  Math.abs(
                                    item.gap
                                  )
                                )}
                              </div>

                              {open ? (
                                <ChevronUp
                                  size={
                                    16
                                  }
                                  className="text-slate-400"
                                />
                              ) : (
                                <ChevronDown
                                  size={
                                    16
                                  }
                                  className="text-slate-400"
                                />
                              )}
                            </button>

                            {open && (
                              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {products.map(
                                    (
                                      product
                                    ) => {
                                      const row =
                                        item.rows.find(
                                          (
                                            daily
                                          ) =>
                                            daily.product_id ===
                                            product.id
                                        );

                                      const value =
                                        Number(
                                          row?.value ||
                                            0
                                        );

                                      return (
                                        <div
                                          key={
                                            product.id
                                          }
                                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3"
                                        >
                                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                            <ProductIcon
                                              code={
                                                product.code
                                              }
                                              size={
                                                18
                                              }
                                            />
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <div className="truncate text-xs font-semibold text-slate-700">
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

                                          <div className="text-xs font-bold text-slate-800">
                                            {value >
                                            0
                                              ? formatShort(
                                                  value
                                                )
                                              : "-"}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {/* =====================================================
          DAILY MODAL
      ===================================================== */}

      {showDailyEditor && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Update Value Harian
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Masukkan value
                  berdasarkan
                  pendapatan hari ini.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowDailyEditor(
                    false
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* DATE */}

            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-semibold text-slate-600">
                  Tanggal Update
                </label>

                <input
                  type="date"
                  value={
                    updateDate
                  }
                  onChange={(e) =>
                    setUpdateDate(
                      e.target.value
                    )
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* INPUT */}

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {products.map(
                  (product) => (
                    <div
                      key={
                        product.id
                      }
                      className="rounded-xl border border-slate-200 p-3 transition focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <ProductIcon
                            code={
                              product.code
                            }
                            size={
                              20
                            }
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-700">
                            {
                              product.name
                            }
                          </div>

                          <div className="mt-0.5 text-[10px] text-slate-400">
                            Value hari ini
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center overflow-hidden rounded-lg border border-slate-200">
                        <span className="px-3 text-xs text-slate-400">
                          Rp
                        </span>

                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          placeholder="0"
                          value={
                            dailyInputs[
                              product.id
                            ] || ""
                          }
                          onChange={(
                            e
                          ) =>
                            setDailyInputs(
                              (
                                prev
                              ) => ({
                                ...prev,
                                [product.id]:
                                  e
                                    .target
                                    .value,
                              })
                            )
                          }
                          className="w-full border-0 px-2 py-2.5 text-sm font-semibold outline-none"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-400">
                Data tersimpan
                langsung ke
                database.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setShowDailyEditor(
                      false
                    )
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  onClick={
                    saveDailyUpdate
                  }
                  disabled={
                    savingDaily
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={15} />

                  {savingDaily
                    ? "Menyimpan..."
                    : "Simpan Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loadingData && (
        <div className="fixed bottom-5 right-5 z-[300] flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
          Memuat data...
        </div>
      )}
    </div>
  );
}