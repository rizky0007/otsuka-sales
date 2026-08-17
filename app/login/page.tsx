"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

type LoginResponse = {
  success?: boolean;
  message?: string;
  user?: {
    id?: string;
    email?: string | null;
  };
};

export default function LoginPage() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // LOGIN
  // =====================================================

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const usernameValue =
      username.trim();

    // ===================================================
    // VALIDASI
    // ===================================================

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
      // =================================================
      // REQUEST KE SERVER API
      // =================================================

      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },

          /*
           * Sangat penting.
           *
           * Browser akan menerima dan mengirim
           * cookie session dari API.
           */
          credentials: "include",

          /*
           * Jangan menggunakan response cache.
           */
          cache: "no-store",

          body: JSON.stringify({
            username: usernameValue,
            password,
          }),
        }
      );

      // =================================================
      // PARSE RESPONSE
      // =================================================

      let result: LoginResponse;

      try {
        result =
          (await response.json()) as LoginResponse;
      } catch {
        throw new Error(
          "Response dari server tidak valid."
        );
      }

      console.log(
        "[LOGIN] HTTP STATUS:",
        response.status
      );

      console.log(
        "[LOGIN] SUCCESS:",
        result.success
      );

      // =================================================
      // LOGIN GAGAL
      // =================================================

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Username atau password salah."
        );
      }

      // =================================================
      // LOGIN BERHASIL
      // =================================================

      console.log(
        "[LOGIN] Login berhasil."
      );

      console.log(
        "[LOGIN] User:",
        result.user
      );

      setError("");

      setSuccess(
        "Login berhasil. Mengalihkan ke dashboard..."
      );

      /*
       * Beri waktu sedikit agar browser selesai
       * menerima Set-Cookie dari response API.
       */
      await new Promise(
        (resolve) =>
          setTimeout(resolve, 500)
      );

      // =================================================
      // REDIRECT
      // =================================================

      /*
       * Gunakan full browser navigation.
       *
       * Ini sengaja tidak menggunakan:
       *
       * router.push("/")
       * router.replace("/")
       *
       * karena session cookie dibuat oleh
       * server API.
       */
      window.location.replace("/");

    } catch (err) {
      console.error(
        "[LOGIN] ERROR:",
        err
      );

      if (err instanceof TypeError) {
        setError(
          "Tidak dapat terhubung ke server. Periksa koneksi internet atau deployment."
        );
      } else if (
        err instanceof Error
      ) {
        setError(err.message);
      } else {
        setError(
          "Terjadi kesalahan saat login."
        );
      }

      setLoading(false);
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="pointer-events-none absolute inset-0">

        {/* Grid */}

        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              `
              linear-gradient(
                rgba(59,130,246,0.18) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(59,130,246,0.18) 1px,
                transparent 1px
              )
              `,
            backgroundSize:
              "52px 52px",
          }}
        />

        {/* Blue glow */}

        <div className="absolute -left-40 top-[-180px] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />

        {/* Cyan glow */}

        <div className="absolute -right-40 bottom-[-180px] h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />

        {/* Center glow */}

        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="relative z-10 flex min-h-screen flex-col">

        {/* =================================================
            TOP BRAND
        ================================================= */}

        <header className="px-5 py-5 sm:px-8 sm:py-7">

          <div className="mx-auto flex max-w-6xl items-center justify-center">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] shadow-lg backdrop-blur-xl">

                <BarChart3
                  size={19}
                  className="text-cyan-400"
                />

              </div>

              <div>

                <p className="text-sm font-bold tracking-wide text-white/90">
                  Otsuka Sales
                </p>

                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
                  Sales Management System
                </p>

              </div>

            </div>

          </div>

        </header>

        {/* =================================================
            MAIN
        ================================================= */}

        <section className="flex flex-1 items-center justify-center px-4 pb-8 pt-2 sm:px-6 sm:pb-12">

          <div className="w-full max-w-[520px]">

            {/* =================================================
                GLASS CARD
            ================================================= */}

            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.12] bg-slate-900/65 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:rounded-[32px]">

              {/* Top highlight */}

              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

              {/* =================================================
                  CARD CONTENT
              ================================================= */}

              <div className="px-6 py-7 sm:px-9 sm:py-9 md:px-10 md:py-10">

                {/* =================================================
                    SECURE BADGE
                ================================================= */}

                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 backdrop-blur-xl">

                  <span className="relative flex h-2 w-2">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />

                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />

                  </span>

                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Secure Access
                  </span>

                </div>

                {/* =================================================
                    TITLE
                ================================================= */}

                <div className="mb-8">

                  <h1 className="text-[30px] font-black tracking-tight text-white sm:text-[36px]">
                    Selamat datang kembali{" "}
                    <span className="inline-block">
                      👋
                    </span>
                  </h1>

                  <p className="mt-2.5 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
                    Masuk menggunakan akun sales
                    Anda untuk melanjutkan aktivitas.
                  </p>

                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                  <div
                    role="alert"
                    className="mb-6 flex gap-3 rounded-2xl border border-red-400/25 bg-red-500/[0.10] p-4"
                  >

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">

                      <AlertCircle
                        size={20}
                        className="text-red-400"
                      />

                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-bold text-red-300">
                        Login gagal
                      </p>

                      <p className="mt-1 text-xs leading-5 text-red-200/75 sm:text-sm">
                        {error}
                      </p>

                    </div>

                  </div>
                )}

                {/* =================================================
                    SUCCESS
                ================================================= */}

                {success && (
                  <div
                    role="status"
                    className="mb-6 flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.08] p-4"
                  >

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">

                      <CheckCircle2
                        size={20}
                        className="text-emerald-400"
                      />

                    </div>

                    <div>

                      <p className="text-sm font-bold text-emerald-300">
                        Login berhasil
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-200/70 sm:text-sm">
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
                  noValidate
                  className="space-y-5"
                >

                  {/* =================================================
                      USERNAME
                  ================================================= */}

                  <div>

                    <label
                      htmlFor="username"
                      className="mb-2.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                    >
                      Username
                    </label>

                    <div className="group relative">

                      <UserRound
                        size={20}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400"
                      />

                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsername(
                            e.target.value
                          )
                        }
                        placeholder="Masukkan username"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        disabled={loading}
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] pl-12 pr-4 text-base font-semibold text-white outline-none transition-all placeholder:text-slate-600 hover:border-white/15 focus:border-blue-400/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:h-15"
                      />

                    </div>

                  </div>

                  {/* =================================================
                      PASSWORD
                  ================================================= */}

                  <div>

                    <div className="mb-2.5 flex items-center justify-between">

                      <label
                        htmlFor="password"
                        className="block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                      >
                        Password
                      </label>

                    </div>

                    <div className="group relative">

                      <LockKeyhole
                        size={20}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400"
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
                          setPassword(
                            e.target.value
                          )
                        }
                        placeholder="Masukkan password"
                        autoComplete="current-password"
                        disabled={loading}
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] pl-12 pr-14 text-base font-semibold text-white outline-none transition-all placeholder:text-slate-600 hover:border-white/15 focus:border-blue-400/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:h-15"
                      />

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          setShowPassword(
                            (value) =>
                              !value
                          )
                        }
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={
                          showPassword
                            ? "Sembunyikan password"
                            : "Tampilkan password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff
                            size={19}
                          />
                        ) : (
                          <Eye
                            size={19}
                          />
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
                    className="group relative mt-2 flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:h-15 sm:text-base"
                  >

                    {/* shine */}

                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    {loading ? (
                      <>
                        <RefreshCw
                          size={20}
                          className="animate-spin"
                        />

                        <span>
                          Memproses login...
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          Masuk ke Dashboard
                        </span>

                        <ArrowRight
                          size={21}
                          className="transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </>
                    )}

                  </button>

                </form>

                {/* =================================================
                    SECURITY
                ================================================= */}

                <div className="mt-8">

                  <div className="flex items-center gap-3">

                    <div className="h-px flex-1 bg-white/[0.08]" />

                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">

                      <ShieldCheck
                        size={14}
                      />

                      Secure Access

                    </div>

                    <div className="h-px flex-1 bg-white/[0.08]" />

                  </div>

                  <p className="mt-5 text-center text-xs leading-5 text-slate-600">
                    Gunakan akun sales yang telah
                    terdaftar untuk mengakses sistem.
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-slate-700">
              Otsuka Sales Management
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}