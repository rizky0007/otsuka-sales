"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";

import {
  CalendarDays,
  Search,
  RefreshCw,
  Plus,
  ShoppingCart,
  Package,
  WalletCards,
  X,
  Save,
  Loader2,
  Store,
  Trash2,
  Menu,
  ChevronRight,
  ReceiptText,
  Hash,
} from "lucide-react";

type Product = {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  active: boolean;
};

type Outlet = {
  id: string;
  code: string | null;
  name: string;
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

type TransactionRow = Transaction & {
  outlet?: Outlet;
  product?: Product;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function getToday() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(date: string) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function TransaksiPage() {
  const supabase = useMemo(() => createClient(), []);

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [search, setSearch] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    outlet_id: "",
    product_id: "",
    quantity: "1",
    value: "",
    date: getToday(),
  });

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const [
        transactionsResponse,
        productsResponse,
        outletsResponse,
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select(
            "id, outlet_id, product_id, quantity, value, date"
          )
          .eq("date", selectedDate)
          .order("id", {
            ascending: false,
          }),

        supabase
          .from("products")
          .select(
            "id, code, name, icon, active"
          )
          .eq("active", true)
          .order("name"),

        supabase
          .from("outlets")
          .select(
            "id, code, name, active"
          )
          .eq("active", true)
          .order("name"),
      ]);

      if (transactionsResponse.error) {
        throw new Error(
          transactionsResponse.error.message
        );
      }

      if (productsResponse.error) {
        throw new Error(
          productsResponse.error.message
        );
      }

      if (outletsResponse.error) {
        throw new Error(
          outletsResponse.error.message
        );
      }

      setTransactions(
        (transactionsResponse.data ||
          []) as Transaction[]
      );

      setProducts(
        (productsResponse.data ||
          []) as Product[]
      );

      setOutlets(
        (outletsResponse.data ||
          []) as Outlet[]
      );
    } catch (error) {
      console.error(
        "LOAD TRANSAKSI ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal memuat transaksi."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const transactionRows =
    useMemo<TransactionRow[]>(() => {
      return transactions.map(
        (transaction) => ({
          ...transaction,

          outlet: outlets.find(
            (outlet) =>
              outlet.id ===
              transaction.outlet_id
          ),

          product: products.find(
            (product) =>
              product.id ===
              transaction.product_id
          ),
        })
      );
    }, [
      transactions,
      outlets,
      products,
    ]);

  const filteredTransactions =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      if (!keyword) {
        return transactionRows;
      }

      return transactionRows.filter(
        (item) => {
          const outletName =
            item.outlet?.name || "";

          const outletCode =
            item.outlet?.code || "";

          const productName =
            item.product?.name || "";

          const productCode =
            item.product?.code || "";

          return (
            outletName
              .toLowerCase()
              .includes(keyword) ||
            outletCode
              .toLowerCase()
              .includes(keyword) ||
            productName
              .toLowerCase()
              .includes(keyword) ||
            productCode
              .toLowerCase()
              .includes(keyword)
          );
        }
      );
    }, [transactionRows, search]);

  const totalTransaction =
    filteredTransactions.length;

  const totalQuantity =
    filteredTransactions.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

  const totalValue =
    filteredTransactions.reduce(
      (total, item) =>
        total +
        Number(item.value || 0),
      0
    );

  function openAddModal() {
    setForm({
      outlet_id: "",
      product_id: "",
      quantity: "1",
      value: "",
      date: selectedDate,
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
  }

  async function saveTransaction() {
    if (!form.outlet_id) {
      alert(
        "Pilih outlet terlebih dahulu."
      );
      return;
    }

    if (!form.product_id) {
      alert(
        "Pilih produk terlebih dahulu."
      );
      return;
    }

    const quantity =
      Number(form.quantity);

    const value =
      Number(form.value);

    if (
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      alert(
        "Quantity harus lebih dari 0."
      );
      return;
    }

    if (
      Number.isNaN(value) ||
      value < 0
    ) {
      alert(
        "Value transaksi tidak valid."
      );
      return;
    }

    try {
      setSaving(true);

      const { error } =
        await supabase
          .from("transactions")
          .insert({
            outlet_id:
              form.outlet_id,

            product_id:
              form.product_id,

            quantity,
            value,
            date: form.date,
          });

      if (error) {
        throw new Error(
          error.message
        );
      }

      setShowModal(false);

      await loadData(true);
    } catch (error) {
      console.error(
        "SAVE TRANSACTION ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan transaksi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Hapus transaksi ini?"
      );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("transactions")
          .delete()
          .eq("id", id);

      if (error) {
        throw new Error(
          error.message
        );
      }

      await loadData(true);
    } catch (error) {
      console.error(
        "DELETE TRANSACTION ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Gagal menghapus transaksi."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <main
        className="
          min-h-screen
          transition-all
          duration-300
          ease-out
          lg:pl-[256px]
        "
      >
        {/* HEADER */}
        <header
          className="
            sticky
            top-0
            z-30
            border-b
            border-slate-200
            bg-white/90
            backdrop-blur-xl
          "
        >
          <div
            className="
              flex
              min-h-[72px]
              items-center
              justify-between
              gap-3
              px-4
              sm:px-6
              lg:px-8
            "
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-600
                  text-white
                  shadow-lg
                  shadow-blue-600/20
                "
              >
                <ReceiptText size={21} />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-black sm:text-xl">
                  Transaksi
                </h1>

                <p className="hidden text-xs text-slate-400 sm:block">
                  Otsuka Sales Management
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
              <CalendarDays
                size={16}
                className="text-blue-600"
              />

              <span className="text-xs font-bold text-slate-600">
                {formatDate(selectedDate)}
              </span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="w-full px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="mx-auto w-full max-w-[1500px]">
            {/* PAGE INTRO */}
            <section className="mb-6">
              <div
                className="
                  flex
                  flex-col
                  gap-5
                  lg:flex-row
                  lg:items-end
                  lg:justify-between
                "
              >
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1
                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.15em]
                        text-blue-600
                      "
                    >
                      SALES ACTIVITY
                    </span>
                  </div>

                  <h2
                    className="
                      text-2xl
                      font-black
                      tracking-tight
                      text-slate-950
                      sm:text-3xl
                    "
                  >
                    Catatan Transaksi
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    Kelola transaksi outlet
                    berdasarkan tanggal,
                    produk, quantity, dan
                    value.
                  </p>
                </div>

                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() =>
                      loadData(true)
                    }
                    disabled={refreshing}
                    className="
                      flex
                      h-11
                      flex-1
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      text-sm
                      font-bold
                      text-slate-700
                      shadow-sm
                      transition
                      hover:-translate-y-0.5
                      hover:bg-slate-50
                      disabled:opacity-50
                      sm:flex-none
                    "
                  >
                    <RefreshCw
                      size={17}
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

                  <button
                    type="button"
                    onClick={openAddModal}
                    className="
                      flex
                      h-11
                      flex-1
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-blue-600
                      px-4
                      text-sm
                      font-bold
                      text-white
                      shadow-lg
                      shadow-blue-600/20
                      transition
                      hover:-translate-y-0.5
                      hover:bg-blue-700
                      sm:flex-none
                    "
                  >
                    <Plus size={18} />

                    <span>
                      Tambah
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* ERROR */}
            {errorMessage && (
              <div
                className="
                  mb-5
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                  text-sm
                  font-medium
                  text-red-700
                "
              >
                <div className="mt-0.5 shrink-0">
                  <X size={18} />
                </div>

                <div className="min-w-0">
                  <p className="font-black">
                    Gagal memuat data
                  </p>

                  <p className="mt-1 break-words text-xs">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {/* FILTER */}
            <section
              className="
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
                  grid
                  gap-3
                  md:grid-cols-[220px_minmax(0,1fr)]
                  xl:grid-cols-[250px_minmax(0,1fr)_auto]
                "
              >
                {/* DATE */}
                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-blue-600
                    "
                  />

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) =>
                      setSelectedDate(
                        event.target.value
                      )
                    }
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      pl-11
                      pr-3
                      text-sm
                      font-bold
                      text-slate-700
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-50
                    "
                  />
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search
                    size={18}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Cari outlet, kode outlet, produk..."
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      pl-11
                      pr-4
                      text-sm
                      font-medium
                      text-slate-800
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-50
                    "
                  />
                </div>

                {/* DATE INFO */}
                <div
                  className="
                    hidden
                    items-center
                    gap-3
                    rounded-xl
                    bg-slate-50
                    px-4
                    md:flex
                  "
                >
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      bg-white
                      text-blue-600
                      shadow-sm
                    "
                  >
                    <CalendarDays size={17} />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Periode
                    </p>

                    <p className="mt-0.5 text-xs font-bold text-slate-700">
                      {formatDate(selectedDate)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SUMMARY */}
            <section
              className="
                mt-5
                grid
                gap-3
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >
              {/* TRANSACTIONS */}
              <SummaryCard
                title="Transaksi"
                value={
                  loading
                    ? "..."
                    : formatNumber(
                        totalTransaction
                      )
                }
                description="Total transaksi"
                icon={
                  <ShoppingCart
                    size={21}
                  />
                }
                iconClass="bg-blue-50 text-blue-600"
              />

              {/* QUANTITY */}
              <SummaryCard
                title="Quantity"
                value={
                  loading
                    ? "..."
                    : formatNumber(
                        totalQuantity
                      )
                }
                description="Total produk terjual"
                icon={
                  <Package size={21} />
                }
                iconClass="bg-emerald-50 text-emerald-600"
              />

              {/* VALUE */}
              <SummaryCard
                title="Total Value"
                value={
                  loading
                    ? "..."
                    : formatRupiah(
                        totalValue
                      )
                }
                description="Nilai transaksi"
                icon={
                  <WalletCards
                    size={21}
                  />
                }
                iconClass="bg-violet-50 text-violet-600"
              />
            </section>

            {/* TRANSACTION LIST */}
            <section
              className="
                mt-5
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-sm
              "
            >
              {/* SECTION HEADER */}
              <div
                className="
                  flex
                  flex-col
                  gap-3
                  border-b
                  border-slate-200
                  p-5
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-100
                      text-slate-700
                    "
                  >
                    <ReceiptText
                      size={20}
                    />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-950">
                      Daftar Transaksi
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDate(
                        selectedDate
                      )}
                    </p>
                  </div>
                </div>

                <div
                  className="
                    flex
                    w-fit
                    items-center
                    gap-2
                    rounded-full
                    bg-slate-100
                    px-3
                    py-1.5
                    text-xs
                    font-black
                    text-slate-500
                  "
                >
                  <Hash size={13} />

                  {formatNumber(
                    filteredTransactions.length
                  )}{" "}
                  data
                </div>
              </div>

              {/* LOADING */}
              {loading ? (
                <div
                  className="
                    flex
                    min-h-[280px]
                    items-center
                    justify-center
                  "
                >
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                    <Loader2
                      size={20}
                      className="animate-spin text-blue-600"
                    />

                    Memuat transaksi...
                  </div>
                </div>
              ) : filteredTransactions.length ===
                0 ? (
                /* EMPTY */
                <div
                  className="
                    flex
                    min-h-[300px]
                    flex-col
                    items-center
                    justify-center
                    px-6
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-2xl
                      bg-slate-100
                      text-slate-300
                    "
                  >
                    <ShoppingCart
                      size={28}
                    />
                  </div>

                  <h4 className="mt-4 font-black text-slate-700">
                    Belum ada transaksi
                  </h4>

                  <p className="mt-1 max-w-md text-sm text-slate-400">
                    Belum ada transaksi
                    pada{" "}
                    {formatDate(
                      selectedDate
                    )}
                    .
                  </p>

                  <button
                    type="button"
                    onClick={openAddModal}
                    className="
                      mt-5
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-blue-600
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-white
                      shadow-lg
                      shadow-blue-600/20
                      transition
                      hover:-translate-y-0.5
                      hover:bg-blue-700
                    "
                  >
                    <Plus size={17} />

                    Tambah Transaksi
                  </button>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[850px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Outlet
                          </th>

                          <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Produk
                          </th>

                          <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Quantity
                          </th>

                          <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Value
                          </th>

                          <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Aksi
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredTransactions.map(
                          (transaction) => (
                            <tr
                              key={
                                transaction.id
                              }
                              className="
                                border-b
                                border-slate-100
                                transition
                                hover:bg-blue-50/40
                              "
                            >
                              {/* OUTLET */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="
                                      flex
                                      h-10
                                      w-10
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded-xl
                                      bg-orange-50
                                      text-orange-600
                                    "
                                  >
                                    <Store
                                      size={18}
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-slate-800">
                                      {transaction
                                        .outlet
                                        ?.name ||
                                        "Outlet tidak ditemukan"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {transaction
                                        .outlet
                                        ?.code ||
                                        "-"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* PRODUCT */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="
                                      flex
                                      h-10
                                      w-10
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded-xl
                                      bg-blue-50
                                      text-blue-600
                                    "
                                  >
                                    <Package
                                      size={18}
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-slate-800">
                                      {transaction
                                        .product
                                        ?.name ||
                                        "Produk tidak ditemukan"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {transaction
                                        .product
                                        ?.code ||
                                        "-"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* QUANTITY */}
                              <td className="px-5 py-4 text-right">
                                <span className="font-black text-slate-800">
                                  {formatNumber(
                                    Number(
                                      transaction.quantity ||
                                        0
                                    )
                                  )}
                                </span>
                              </td>

                              {/* VALUE */}
                              <td className="px-5 py-4 text-right">
                                <span className="font-black text-slate-800">
                                  {formatRupiah(
                                    Number(
                                      transaction.value ||
                                        0
                                    )
                                  )}
                                </span>
                              </td>

                              {/* ACTION */}
                              <td className="px-5 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteTransaction(
                                      transaction.id
                                    )
                                  }
                                  className="
                                    inline-flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-lg
                                    text-slate-400
                                    transition
                                    hover:bg-red-50
                                    hover:text-red-600
                                  "
                                  title="Hapus transaksi"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARDS */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {filteredTransactions.map(
                      (transaction) => (
                        <div
                          key={
                            transaction.id
                          }
                          className="
                            p-4
                            transition
                            active:bg-slate-50
                          "
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className="
                                  flex
                                  h-11
                                  w-11
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-xl
                                  bg-orange-50
                                  text-orange-600
                                "
                              >
                                <Store
                                  size={19}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-black text-slate-800">
                                  {transaction
                                    .outlet
                                    ?.name ||
                                    "Outlet tidak ditemukan"}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  {transaction
                                    .outlet
                                    ?.code ||
                                    "-"}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                deleteTransaction(
                                  transaction.id
                                )
                              }
                              className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                text-slate-400
                                hover:bg-red-50
                                hover:text-red-600
                              "
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>

                          <div
                            className="
                              mt-4
                              rounded-xl
                              bg-slate-50
                              p-3
                            "
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="
                                  flex
                                  h-9
                                  w-9
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-white
                                  text-blue-600
                                  shadow-sm
                                "
                              >
                                <Package
                                  size={17}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-800">
                                  {transaction
                                    .product
                                    ?.name ||
                                    "Produk tidak ditemukan"}
                                </p>

                                <p className="text-xs text-slate-400">
                                  {transaction
                                    .product
                                    ?.code ||
                                    "-"}
                                </p>
                              </div>
                            </div>

                            <div
                              className="
                                mt-3
                                grid
                                grid-cols-2
                                gap-2
                              "
                            >
                              <div className="rounded-lg bg-white p-3">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Quantity
                                </p>

                                <p className="mt-1 text-sm font-black text-slate-800">
                                  {formatNumber(
                                    Number(
                                      transaction.quantity ||
                                        0
                                    )
                                  )}
                                </p>
                              </div>

                              <div className="rounded-lg bg-white p-3">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Value
                                </p>

                                <p className="mt-1 truncate text-sm font-black text-slate-800">
                                  {formatRupiah(
                                    Number(
                                      transaction.value ||
                                        0
                                    )
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </section>

            {/* FOOTER */}
            <footer
              className="
                flex
                flex-col
                gap-1
                px-1
                py-6
                text-xs
                text-slate-400
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <p className="font-semibold">
                Otsuka Sales Management
              </p>

              <p>
                Data transaksi{" "}
                {formatDate(selectedDate)}
              </p>
            </footer>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-end
            justify-center
            bg-slate-950/50
            p-0
            backdrop-blur-sm
            sm:items-center
            sm:p-4
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="
              w-full
              max-h-[92vh]
              overflow-y-auto
              rounded-t-3xl
              bg-white
              shadow-2xl
              sm:max-w-lg
              sm:rounded-3xl
            "
          >
            {/* MODAL HEADER */}
            <div
              className="
                sticky
                top-0
                z-10
                flex
                items-center
                justify-between
                border-b
                border-slate-200
                bg-white/95
                px-5
                py-4
                backdrop-blur
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-50
                    text-blue-600
                  "
                >
                  <Plus size={19} />
                </div>

                <div>
                  <h3 className="font-black text-slate-950">
                    Tambah Transaksi
                  </h3>

                  <p className="text-xs text-slate-400">
                    Input transaksi baru
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:opacity-50
                "
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}
            <div className="space-y-4 p-5">
              {/* DATE */}
              <FormField label="Tanggal">
                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-blue-600
                    "
                  />

                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          date: event.target
                            .value,
                        })
                      )
                    }
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      pl-11
                      pr-4
                      text-sm
                      font-semibold
                      outline-none
                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-50
                    "
                  />
                </div>
              </FormField>

              {/* OUTLET */}
              <FormField label="Outlet">
                <div className="relative">
                  <Store
                    size={17}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-orange-500
                    "
                  />

                  <select
                    value={
                      form.outlet_id
                    }
                    onChange={(event) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          outlet_id:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="
                      h-12
                      w-full
                      appearance-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      pl-11
                      pr-4
                      text-sm
                      font-semibold
                      outline-none
                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-50
                    "
                  >
                    <option value="">
                      Pilih outlet
                    </option>

                    {outlets.map(
                      (outlet) => (
                        <option
                          key={
                            outlet.id
                          }
                          value={
                            outlet.id
                          }
                        >
                          {outlet.code
                            ? `${outlet.code} - `
                            : ""}
                          {outlet.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </FormField>

              {/* PRODUCT */}
              <FormField label="Produk">
                <div className="relative">
                  <Package
                    size={17}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-blue-600
                    "
                  />

                  <select
                    value={
                      form.product_id
                    }
                    onChange={(event) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          product_id:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="
                      h-12
                      w-full
                      appearance-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      pl-11
                      pr-4
                      text-sm
                      font-semibold
                      outline-none
                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-50
                    "
                  >
                    <option value="">
                      Pilih produk
                    </option>

                    {products.map(
                      (product) => (
                        <option
                          key={
                            product.id
                          }
                          value={
                            product.id
                          }
                        >
                          {product.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </FormField>

              {/* QTY VALUE */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Quantity">
                  <div className="relative">
                    <Package
                      size={17}
                      className="
                        pointer-events-none
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-emerald-600
                      "
                    />

                    <input
                      type="number"
                      min="1"
                      value={
                        form.quantity
                      }
                      onChange={(event) =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            quantity:
                              event.target
                                .value,
                          })
                        )
                      }
                      className="
                        h-12
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        pl-11
                        pr-4
                        text-sm
                        font-semibold
                        outline-none
                        focus:border-blue-500
                        focus:bg-white
                        focus:ring-4
                        focus:ring-blue-50
                      "
                    />
                  </div>
                </FormField>

                <FormField label="Value (Rp)">
                  <div className="relative">
                    <WalletCards
                      size={17}
                      className="
                        pointer-events-none
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-violet-600
                      "
                    />

                    <input
                      type="number"
                      min="0"
                      value={form.value}
                      onChange={(event) =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            value:
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="0"
                      className="
                        h-12
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        pl-11
                        pr-4
                        text-sm
                        font-semibold
                        outline-none
                        focus:border-blue-500
                        focus:bg-white
                        focus:ring-4
                        focus:ring-blue-50
                      "
                    />
                  </div>
                </FormField>
              </div>

              {/* ACTION */}
              <div
                className="
                  flex
                  flex-col-reverse
                  gap-2
                  border-t
                  border-slate-100
                  pt-5
                  sm:flex-row
                  sm:justify-end
                "
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="
                    h-11
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-5
                    text-sm
                    font-bold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={
                    saveTransaction
                  }
                  disabled={saving}
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-5
                    text-sm
                    font-bold
                    text-white
                    shadow-lg
                    shadow-blue-600/20
                    transition
                    hover:bg-blue-700
                    disabled:opacity-60
                  "
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Menyimpan..."
                    : "Simpan Transaksi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div
      className="
        group
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition
        duration-300
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      <div className="flex items-center gap-4">
        <div
          className={`
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-2xl
            transition
            duration-300
            group-hover:scale-105
            ${iconClass}
          `}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            {title}
          </p>

          <p className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
            {value}
          </p>

          <p className="mt-0.5 text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </label>

      {children}
    </div>
  );
}