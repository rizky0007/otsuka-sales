"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  UserRound,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ============================================================
     CHECK SESSION
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const supabase = createClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          router.replace("/");
          router.refresh();
          return;
        }
      } catch (err) {
        console.error(
          "Session check error:",
          err
        );
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* ============================================================
     LOGIN
  ============================================================ */

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const cleanUsername =
        username.trim().toLowerCase();

      if (!cleanUsername) {
        throw new Error(
          "Username wajib diisi."
        );
      }

      if (!password) {
        throw new Error(
          "Password wajib diisi."
        );
      }

      /*
       * Username internal Supabase
       *
       * tort04
       * ↓
       * tort04@otsuka.local
       */
      const loginEmail =
        `${cleanUsername}@otsuka.local`;

      const supabase = createClient();

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

      if (loginError) {
        console.error(
          "Supabase login error:",
          loginError
        );

        const message =
          loginError.message?.toLowerCase() ||
          "";

        if (
          message.includes(
            "invalid login credentials"
          )
        ) {
          throw new Error(
            "Username atau password salah."
          );
        }

        if (
          message.includes(
            "email not confirmed"
          )
        ) {
          throw new Error(
            "Akun belum dikonfirmasi."
          );
        }

        throw new Error(
          loginError.message
        );
      }

      if (!data.user) {
        throw new Error(
          "User tidak ditemukan."
        );
      }

      if (!data.session) {
        throw new Error(
          "Session tidak berhasil dibuat."
        );
      }

      /*
       * LOGIN BERHASIL
       *
       * http://localhost:3000/
       */
      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Login gagal. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (checkingSession) {
    return (
      <main className="flex min-h-dvh items-center justify-center overflow-hidden bg-[#03152f]">

        <div className="absolute h-[300px] w-[300px] rounded-full bg-blue-500/20 blur-[100px]" />

        <div className="relative flex flex-col items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.25)] backdrop-blur-xl">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
          </div>

          <p className="text-sm text-blue-200/60">
            Memuat Otsuka Sales...
          </p>

        </div>
      </main>
    );
  }

  /* ============================================================
     LOGIN PAGE
  ============================================================ */

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#03152f] text-white">

      {/* ========================================================
          BACKGROUND GLOW
      ======================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Top left */}

        <div className="absolute -left-32 -top-32 h-[360px] w-[360px] rounded-full bg-blue-600/30 blur-[110px] sm:h-[500px] sm:w-[500px]" />

        {/* Top right */}

        <div className="absolute -right-40 top-[5%] h-[360px] w-[360px] rounded-full bg-cyan-400/20 blur-[120px] sm:h-[500px] sm:w-[500px]" />

        {/* Bottom */}

        <div className="absolute bottom-[-250px] left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-600/30 blur-[130px]" />

        {/* Center */}

        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]" />

        {/* Grid */}

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

      </div>

      {/* ========================================================
          MAIN CONTAINER
      ======================================================== */}

      <div className="relative flex min-h-dvh w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-10">

        <div className="w-full max-w-[470px]">

          {/* ==================================================
              LOGO
          ================================================== */}

          <div className="mb-6 flex justify-center sm:mb-8">

            <div className="group relative">

              {/* Glow */}

              <div className="absolute inset-0 rounded-[22px] bg-blue-500/40 blur-xl transition duration-500 group-hover:bg-cyan-400/40" />

              {/* Logo */}

              <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] border border-blue-300/20 bg-gradient-to-br from-blue-500/30 via-blue-600/20 to-cyan-400/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:h-[70px] sm:w-[70px]">

                <Zap className="h-7 w-7 fill-cyan-300 text-cyan-300 sm:h-8 sm:w-8" />

              </div>

            </div>

          </div>

          {/* ==================================================
              TITLE
          ================================================== */}

          <div className="mb-6 text-center sm:mb-8">

            <div className="mb-2 flex items-center justify-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                Sales Management
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]" />

            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Otsuka{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Sales
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-blue-100/50">
              Kelola aktivitas sales dengan
              lebih cepat dan terorganisir.
            </p>

          </div>

          {/* ==================================================
              GLASS FORM
          ================================================== */}

          <div className="relative overflow-hidden rounded-[28px] border border-blue-200/15 bg-blue-950/30 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-7">

            {/* Card highlight */}

            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

            <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

            {/* Card heading */}

            <div className="relative mb-6">

              <h2 className="text-lg font-bold text-white">
                Selamat datang kembali
              </h2>

              <p className="mt-1 text-xs leading-5 text-blue-100/40">
                Masuk menggunakan akun sales Anda.
              </p>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleLogin}
              className="relative space-y-4"
            >

              {/* Username */}

              <div>

                <label
                  htmlFor="username"
                  className="mb-2 block text-xs font-semibold text-blue-100/70"
                >
                  Username
                </label>

                <div className="group relative">

                  <div className="pointer-events-none absolute left-0 top-0 flex h-full w-12 items-center justify-center">

                    <UserRound className="h-[18px] w-[18px] text-blue-200/30 transition-colors group-focus-within:text-cyan-300" />

                  </div>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                      )
                    }
                    placeholder="Masukkan username"
                    disabled={loading}
                    required
                    spellCheck={false}
                    className="h-14 w-full rounded-2xl border border-blue-200/10 bg-white/[0.045] pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-blue-100/25 hover:border-blue-200/20 focus:border-cyan-300/40 focus:bg-blue-400/[0.06] focus:shadow-[0_0_0_4px_rgba(34,211,238,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold text-blue-100/70"
                >
                  Password
                </label>

                <div className="group relative">

                  <div className="pointer-events-none absolute left-0 top-0 flex h-full w-12 items-center justify-center">

                    <LockKeyhole className="h-[18px] w-[18px] text-blue-200/30 transition-colors group-focus-within:text-cyan-300" />

                  </div>

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Masukkan password"
                    disabled={loading}
                    required
                    className="h-14 w-full rounded-2xl border border-blue-200/10 bg-white/[0.045] pl-12 pr-12 text-sm text-white outline-none transition-all placeholder:text-blue-100/25 hover:border-blue-200/20 focus:border-cyan-300/40 focus:bg-blue-400/[0.06] focus:shadow-[0_0_0_4px_rgba(34,211,238,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-blue-100/30 transition-colors hover:text-cyan-300 disabled:opacity-40"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>

                </div>

              </div>

              {/* Error */}

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3">

                  <p className="text-xs leading-5 text-red-300">
                    {error}
                  </p>

                </div>
              )}

              {/* Login button */}

              <button
                type="submit"
                disabled={loading}
                className="group relative mt-2 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-sm font-bold text-white shadow-[0_12px_35px_rgba(37,99,235,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(34,211,238,0.22)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {/* Shine */}

                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                {loading ? (
                  <>
                    <Loader2 className="relative h-4 w-4 animate-spin" />

                    <span className="relative">
                      Memproses...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative">
                      Masuk ke Sistem
                    </span>

                    <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}

              </button>

            </form>

            {/* =================================================
                BOTTOM INFO
            ================================================= */}

            <div className="relative mt-6 flex items-center justify-center gap-2">

              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />

              <span className="text-[10px] text-blue-100/30">
                Secure authentication
              </span>

            </div>

          </div>

          {/* Footer */}

          <p className="mt-5 text-center text-[10px] text-blue-100/25">
            Otsuka Sales Management System
          </p>

        </div>

      </div>
    </main>
  );
}