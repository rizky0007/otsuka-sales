"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  WifiOff,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

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

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const usernameValue =
      username.trim();

    if (!usernameValue) {
      setError(
        "Username wajib diisi."
      );
      return;
    }

    if (!password) {
      setError(
        "Password wajib diisi."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * =================================================
       * LOGIN MELALUI SERVER NEXT.JS
       *
       * Tidak lagi memanggil Supabase langsung
       * dari browser.
       * =================================================
       */

      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            username:
              usernameValue,
            password,
          }),
        }
      );

      let result: any = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Login gagal."
        );
      }

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Login gagal."
        );
      }

      /*
       * =================================================
       * LOGIN BERHASIL
       * =================================================
       */

      setSuccess(
        "Login berhasil. Mengalihkan ke dashboard..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            500
          )
      );

      router.replace("/");

      router.refresh();
    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      if (
        err instanceof TypeError &&
        err.message ===
          "Failed to fetch"
      ) {
        setError(
          "Tidak dapat terhubung ke server. Periksa koneksi internet atau coba lagi."
        );
      } else if (
        err instanceof Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Terjadi kesalahan saat login."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="absolute inset-0">
        {/* Grid */}

        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              `
              linear-gradient(
                rgba(148,163,184,0.3) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(148,163,184,0.3) 1px,
                transparent 1px
              )
              `,
            backgroundSize:
              "52px 52px",
          }}
        />

        {/* Glow kiri */}

        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

        {/* Glow kanan */}

        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />

        {/* Glow tengah */}

        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[720px]">

          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/65 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10 md:p-12">

            {/* top highlight */}

            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-8">

              {/* Badge */}

              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                <span className="text-[11px] font-black tracking-[0.2em] text-slate-400">
                  SECURE ACCESS
                </span>

                <ShieldCheck
                  size={14}
                  className="text-emerald-400"
                />
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Selamat datang{" "}
                <span className="inline-block">
                  👋
                </span>
              </h1>

              <p className="mt-3 text-base font-medium leading-7 text-slate-400 sm:text-lg">
                Masuk untuk mengelola
                aktivitas sales Anda.
              </p>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-7 flex items-start gap-4 rounded-2xl border border-red-400/25 bg-red-500/[0.12] p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                  {error.includes(
                    "terhubung"
                  ) ? (
                    <WifiOff
                      size={20}
                      className="text-red-400"
                    />
                  ) : (
                    <AlertCircle
                      size={20}
                      className="text-red-400"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-black text-red-300">
                    Login gagal
                  </p>

                  <p className="mt-1 text-sm font-medium leading-6 text-red-200/75">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
              <div className="mb-7 flex items-start gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.10] p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                  <CheckCircle2
                    size={20}
                    className="text-emerald-400"
                  />
                </div>

                <div>
                  <p className="text-sm font-black text-emerald-300">
                    Berhasil
                  </p>

                  <p className="mt-1 text-sm text-emerald-200/75">
                    {success}
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={
                handleLogin
              }
              className="space-y-6"
            >

              {/* =================================================
                  USERNAME
              ================================================= */}

              <div>
                <label
                  htmlFor="username"
                  className="mb-2.5 block text-xs font-black tracking-[0.16em] text-slate-400"
                >
                  USERNAME
                </label>

                <div className="group relative">

                  <UserRound
                    size={21}
                    className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition group-focus-within:text-blue-400"
                  />

                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={
                      username
                    }
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                      )
                    }
                    placeholder="Masukkan username"
                    autoComplete="username"
                    disabled={
                      loading
                    }
                    className="h-[70px] w-full rounded-[22px] border border-white/10 bg-white/[0.055] pl-14 pr-5 text-base font-semibold text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-blue-400/60 focus:bg-white/[0.075] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2.5 block text-xs font-black tracking-[0.16em] text-slate-400"
                >
                  PASSWORD
                </label>

                <div className="group relative">

                  <LockKeyhole
                    size={21}
                    className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition group-focus-within:text-blue-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      password
                    }
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    disabled={
                      loading
                    }
                    className="h-[70px] w-full rounded-[22px] border border-white/10 bg-white/[0.055] pl-14 pr-14 text-base font-semibold text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-blue-400/60 focus:bg-white/[0.075] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) =>
                          !value
                      )
                    }
                    disabled={
                      loading
                    }
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={20}
                      />
                    ) : (
                      <Eye
                        size={20}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* =================================================
                  BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="group relative mt-2 flex h-[70px] w-full items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-base font-black text-white shadow-[0_18px_45px_rgba(37,99,235,0.25)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(37,99,235,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {/* shine */}

                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition duration-700 group-hover:translate-x-full" />

                {loading ? (
                  <>
                    <Loader2
                      size={21}
                      className="mr-3 animate-spin"
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
                      size={23}
                      className="ml-3 transition duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="mt-10">

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/[0.08]" />

                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-600">
                  <ShieldCheck
                    size={14}
                  />

                  SECURE ACCESS
                </div>

                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <p className="mt-7 text-center text-xs font-medium leading-6 text-slate-600">
                Gunakan akun sales yang
                telah terdaftar untuk
                mengakses sistem.
              </p>

              <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">
                Otsuka Sales Management
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}