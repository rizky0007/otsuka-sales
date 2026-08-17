"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  UserRound,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError("Username wajib diisi.");
      return;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: cleanUsername,
          password,
        }),
      });

      let result: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Username atau password salah."
        );
      }

      setSuccess(
        result.message || "Login berhasil. Mengalihkan..."
      );

      // Beri waktu agar cookie/session tersimpan
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Terjadi kesalahan saat login. Silakan coba lagi."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="absolute inset-0">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* =================================================
              BRAND
          ================================================== */}

          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                <LogIn
                  size={23}
                  strokeWidth={2.4}
                  className="text-white"
                />
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Otsuka Sales
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Sales Management System
            </p>
          </div>

          {/* =================================================
              LOGIN CARD
          ================================================== */}

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur-2xl">
            {/* Top accent */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

            <div className="p-5 sm:p-7">
              {/* HEADER */}

              <div className="mb-7">
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Selamat datang kembali
                </h2>

                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  Masuk menggunakan akun sales Anda untuk
                  melanjutkan.
                </p>
              </div>

              {/* =================================================
                  ERROR
              ================================================== */}

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3.5 text-sm text-red-300">
                  <div className="mt-0.5 shrink-0">
                    <AlertCircle size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold">
                      Login gagal
                    </p>

                    <p className="mt-0.5 break-words text-xs leading-relaxed text-red-300/80">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================
                  SUCCESS
              ================================================== */}

              {success && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="font-semibold">
                      Berhasil
                    </p>

                    <p className="mt-0.5 text-xs text-emerald-300/80">
                      {success}
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================
                  FORM
              ================================================== */}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                {/* USERNAME */}

                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    Username
                  </label>

                  <div className="group relative">
                    <UserRound
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-blue-400"
                    />

                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value)
                      }
                      placeholder="Masukkan username"
                      autoComplete="username"
                      disabled={loading}
                      autoFocus
                      className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.07] pl-11 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 hover:bg-white/[0.09] focus:border-blue-500/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Password
                    </label>
                  </div>

                  <div className="group relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-blue-400"
                    />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Masukkan password"
                      autoComplete="current-password"
                      disabled={loading}
                      className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.07] pl-11 pr-12 text-sm font-medium text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 hover:bg-white/[0.09] focus:border-blue-500/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* =================================================
                    LOGIN BUTTON
                ================================================== */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {/* Shine */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  {loading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="3"
                        />

                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z"
                        />
                      </svg>

                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>

                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* =================================================
                  FOOTER INFO
              ================================================== */}

              <div className="mt-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />

                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Otsuka Sales
                </span>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-600">
                Gunakan akun yang telah terdaftar untuk
                mengakses sistem sales.
              </p>
            </div>
          </div>

          {/* COPYRIGHT */}

          <p className="mt-6 text-center text-[10px] font-medium text-slate-600">
            © {new Date().getFullYear()} Otsuka Sales
            Management System
          </p>
        </div>
      </div>
    </main>
  );
}