"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Loader2,
  UserRound,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

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

    const usernameValue = username.trim();

    if (!usernameValue) {
      setError("Username wajib diisi.");
      return;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      /*
       * =====================================================
       * 1. CARI EMAIL BERDASARKAN USERNAME
       * =====================================================
       */

      const { data: email, error: lookupError } =
        await supabase.rpc("get_login_email", {
          p_username: usernameValue,
        });

      console.log("LOGIN USERNAME:", usernameValue);
      console.log("LOGIN EMAIL:", email);
      console.log("LOOKUP ERROR:", lookupError);

      if (lookupError) {
        console.error("GET LOGIN EMAIL ERROR:", lookupError);

        throw new Error(
          "Gagal mencari akun. " + lookupError.message
        );
      }

      if (!email) {
        throw new Error("Username tidak ditemukan.");
      }

      /*
       * =====================================================
       * 2. LOGIN SUPABASE AUTH
       * =====================================================
       */

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: String(email),
          password,
        });

      console.log("AUTH DATA:", authData);
      console.log("AUTH ERROR:", authError);

      if (authError) {
        console.error("SUPABASE AUTH ERROR:", authError);

        throw new Error(
          "Username atau password salah."
        );
      }

      if (!authData.user) {
        throw new Error(
          "Login gagal. User tidak ditemukan."
        );
      }

      /*
       * =====================================================
       * 3. CEK SESSION
       * =====================================================
       */

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          "Gagal memeriksa session login."
        );
      }

      if (!sessionData.session) {
        throw new Error(
          "Session login tidak berhasil dibuat."
        );
      }

      /*
       * =====================================================
       * 4. LOGIN BERHASIL
       * =====================================================
       */

      setSuccess("Login berhasil. Membuka dashboard...");

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
        setError("Terjadi kesalahan saat login.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="absolute inset-0">
        {/* Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.30),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.20),_transparent_35%)]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "45px 45px",
          }}
        />

        {/* Blur circles */}
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* =================================================
              BRAND
          ================================================= */}

          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-blue-500/20 backdrop-blur-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/30">
                <LogIn
                  size={23}
                  strokeWidth={2.5}
                  className="text-white"
                />
              </div>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white">
              Otsuka Sales
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Sales Management System
            </p>
          </div>

          {/* =================================================
              GLASS LOGIN CARD
          ================================================= */}

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/40 backdrop-blur-2xl">
            {/* Card highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="mb-7">
                <h2 className="text-xl font-bold text-white">
                  Selamat datang 👋
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Masuk untuk mengelola aktivitas sales Anda.
                </p>
              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 backdrop-blur-md">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                    <AlertCircle
                      size={16}
                      className="text-red-400"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-red-300">
                      Login gagal
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-200/80">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================
                  SUCCESS
              ================================================= */}

              {success && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 backdrop-blur-md">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                    <CheckCircle2
                      size={16}
                      className="text-emerald-400"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-emerald-300">
                      Berhasil
                    </p>

                    <p className="mt-1 text-xs text-emerald-200/80">
                      {success}
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================
                  FORM
              ================================================= */}

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
                      className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm font-medium text-white outline-none transition duration-200 placeholder:text-slate-500 hover:border-white/20 hover:bg-white/[0.08] focus:border-blue-400/50 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-12 text-sm font-medium text-white outline-none transition duration-200 placeholder:text-slate-500 hover:border-white/20 hover:bg-white/[0.08] focus:border-blue-400/50 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
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
                ================================================= */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {/* Shine */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      <span>
                        Memproses login...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>

                      <ArrowRight
                        size={18}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="mt-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />

                <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
                  Secure Access
                </span>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
                Gunakan akun sales yang telah terdaftar
                untuk mengakses sistem.
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