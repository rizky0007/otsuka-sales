"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  UserRound,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // JIKA SUDAH LOGIN
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const response = await fetch(
          "/api/auth/session",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!response.ok) return;

        const contentType =
          response.headers.get("content-type") || "";

        if (
          !contentType.includes(
            "application/json"
          )
        ) {
          return;
        }

        const data = await response.json();

        if (
          mounted &&
          data?.authenticated
        ) {
          router.replace("/");
        }
      } catch {
        // Tidak perlu menampilkan error.
        // User tetap bisa login.
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

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

    const cleanUsername =
      username.trim();

    if (!cleanUsername) {
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

          credentials: "include",

          cache: "no-store",

          body: JSON.stringify({
            username: cleanUsername,
            password,
          }),
        }
      );

      // =================================================
      // BACA RESPONSE DENGAN AMAN
      // =================================================

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      const rawText =
        await response.text();

      console.log(
        "[LOGIN] HTTP STATUS:",
        response.status
      );

      console.log(
        "[LOGIN] CONTENT TYPE:",
        contentType
      );

      console.log(
        "[LOGIN] RESPONSE:",
        rawText
      );

      let data: any = null;

      // =================================================
      // RESPONSE JSON
      // =================================================

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        try {
          data = JSON.parse(rawText);
        } catch (jsonError) {
          console.error(
            "[LOGIN] JSON PARSE ERROR:",
            jsonError
          );
        }
      }

      // =================================================
      // RESPONSE BUKAN JSON
      // =================================================

      if (!data) {
        if (
          rawText.includes(
            "<!DOCTYPE"
          ) ||
          rawText.includes(
            "<html"
          )
        ) {
          throw new Error(
            "Server mengembalikan halaman HTML. Pastikan API /api/auth/login tersedia dan tidak diarahkan oleh middleware."
          );
        }

        throw new Error(
          "Response dari server tidak valid."
        );
      }

      // =================================================
      // LOGIN GAGAL
      // =================================================

      if (
        !response.ok ||
        data.success !== true
      ) {
        throw new Error(
          data.message ||
            "Username atau password salah."
        );
      }

      // =================================================
      // LOGIN BERHASIL
      // =================================================

      console.log(
        "[LOGIN] LOGIN BERHASIL",
        data
      );

      setError("");

      setSuccess(
        "Login berhasil. Membuka dashboard..."
      );

      // =================================================
      // PENTING:
      // Cookie dari API sudah diterima browser.
      //
      // Tunggu sedikit agar cookie/session
      // tersimpan sebelum pindah halaman.
      // =================================================

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 500)
      );

      // =================================================
      // PINDAH KE DASHBOARD
      // =================================================

      router.replace("/");

      router.refresh();
    } catch (err) {
      console.error(
        "[LOGIN] ERROR:",
        err
      );

      if (
        err instanceof Error
      ) {
        setError(err.message);
      } else {
        setError(
          "Terjadi kesalahan saat login."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // ENTER KEY
  // =====================================================

  function handleUsernameKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      e.preventDefault();

      const passwordInput =
        document.getElementById(
          "password"
        ) as HTMLInputElement | null;

      passwordInput?.focus();
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="pointer-events-none absolute inset-0">
        {/* GRID */}

        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(148,163,184,0.16) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(148,163,184,0.16) 1px,
                transparent 1px
              )
            `,
            backgroundSize:
              "52px 52px",
          }}
        />

        {/* BLUE GLOW */}

        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]" />

        {/* CYAN GLOW */}

        <div className="absolute -bottom-48 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />

        {/* CENTER GLOW */}

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.03] blur-[100px]" />
      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-[760px]">

          {/* BRAND */}

          <div className="mb-5 text-center sm:mb-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/50 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-400 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />

              SALES MANAGEMENT SYSTEM
            </div>
          </div>

          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <section className="relative overflow-hidden rounded-[30px] border border-white/[0.10] bg-slate-900/70 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">

            {/* TOP LINE */}

            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

            {/* CARD CONTENT */}

            <div className="p-6 sm:p-9 md:p-12">

              {/* =================================================
                  ACCESS BADGE
              ================================================= */}

              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/60 px-4 py-2 text-xs font-bold tracking-[0.16em] text-slate-400">
                <ShieldCheck
                  size={15}
                  className="text-emerald-400"
                />

                SECURE ACCESS
              </div>

              {/* =================================================
                  TITLE
              ================================================= */}

              <div className="mb-8">
                <h1 className="text-[clamp(2rem,5vw,3.3rem)] font-black leading-[1.05] tracking-tight text-white">
                  Selamat datang
                  <br className="sm:hidden" />{" "}
                  kembali{" "}
                  <span className="inline-block">
                    👋
                  </span>
                </h1>

                <p className="mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                  Masuk menggunakan akun
                  sales Anda untuk
                  melanjutkan aktivitas.
                </p>
              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div
                  role="alert"
                  className="mb-7 flex gap-4 rounded-2xl border border-red-400/25 bg-red-500/[0.10] p-4 sm:p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                    <AlertCircle
                      size={22}
                      className="text-red-400"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-red-300">
                      Login gagal
                    </p>

                    <p className="mt-1 break-words text-sm leading-6 text-red-200/75">
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
                  className="mb-7 flex gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.08] p-4 sm:p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                    <CheckCircle2
                      size={22}
                      className="text-emerald-400"
                    />
                  </div>

                  <div>
                    <p className="font-bold text-emerald-300">
                      Login berhasil
                    </p>

                    <p className="mt-1 text-sm text-emerald-200/70">
                      Membuka dashboard...
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================
                  FORM
              ================================================= */}

              <form
                onSubmit={handleLogin}
                className="space-y-6"
              >

                {/* =================================================
                    USERNAME
                ================================================= */}

                <div>
                  <label
                    htmlFor="username"
                    className="mb-2.5 block text-xs font-extrabold tracking-[0.14em] text-slate-400"
                  >
                    USERNAME
                  </label>

                  <div className="group relative">
                    <UserRound
                      size={21}
                      className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-blue-400"
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
                      onKeyDown={
                        handleUsernameKeyDown
                      }
                      placeholder="Masukkan username"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      disabled={loading}
                      className="h-[62px] w-full rounded-2xl border border-slate-700/80 bg-slate-800/70 pl-14 pr-5 text-base font-semibold text-white outline-none transition-all placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-500 focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* =================================================
                    PASSWORD
                ================================================= */}

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2.5 block text-xs font-extrabold tracking-[0.14em] text-slate-400"
                  >
                    PASSWORD
                  </label>

                  <div className="group relative">
                    <LockKeyhole
                      size={21}
                      className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-blue-400"
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
                      className="h-[62px] w-full rounded-2xl border border-slate-700/80 bg-slate-800/70 pl-14 pr-14 text-base font-semibold text-white outline-none transition-all placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-500 focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-700/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                    SUBMIT
                ================================================= */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 flex h-[64px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-base font-extrabold text-white shadow-[0_15px_35px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(37,99,235,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {/* SHINE */}

                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  {loading ? (
                    <>
                      <Loader2
                        size={21}
                        className="mr-3 animate-spin"
                      />

                      Memproses login...
                    </>
                  ) : (
                    <>
                      <LogIn
                        size={21}
                        className="mr-3"
                      />

                      Masuk ke Dashboard

                      <ArrowRight
                        size={22}
                        className="ml-3 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* =================================================
                  DIVIDER
              ================================================= */}

              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-800" />

                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-600">
                  OTSUKA SALES
                </span>

                <div className="h-px flex-1 bg-slate-800" />
              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="text-center">
                <p className="text-xs leading-6 text-slate-500 sm:text-sm">
                  Gunakan akun yang telah
                  terdaftar untuk mengakses
                  sistem sales.
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              BOTTOM
          ================================================= */}

          <p className="mt-5 text-center text-[11px] text-slate-600">
            Otsuka Sales Management System
          </p>
        </div>
      </div>
    </main>
  );
}