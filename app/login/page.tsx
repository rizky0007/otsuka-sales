"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  RefreshCw,
  UserRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const supabase = createClient();

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
    setLoading(true);

    try {
      const usernameValue = username.trim();

      if (!usernameValue) {
        throw new Error("Username wajib diisi.");
      }

      if (!password) {
        throw new Error("Password wajib diisi.");
      }

      /*
       * =====================================================
       * 1. CARI EMAIL BERDASARKAN USERNAME
       *
       * Menggunakan RPC karena RLS profiles aktif.
       * =====================================================
       */

      const {
        data: email,
        error: lookupError,
      } = await supabase.rpc("get_login_email", {
        p_username: usernameValue,
      });

      console.log("LOGIN USERNAME:", usernameValue);
      console.log("LOGIN EMAIL:", email);
      console.log("LOOKUP ERROR:", lookupError);

      if (lookupError) {
        console.error(
          "GET LOGIN EMAIL ERROR:",
          lookupError
        );

        throw new Error(
          "Gagal mencari akun. " +
            lookupError.message
        );
      }

      if (!email) {
        throw new Error(
          "Username tidak ditemukan."
        );
      }

      /*
       * =====================================================
       * 2. LOGIN KE SUPABASE AUTH
       * =====================================================
       */

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: String(email),
        password,
      });

      console.log("AUTH DATA:", authData);
      console.log("AUTH ERROR:", authError);

      if (authError) {
        console.error(
          "SUPABASE AUTH ERROR:",
          authError
        );

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

      const {
        data: sessionData,
      } = await supabase.auth.getSession();

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

      setSuccess(
        "Login berhasil. Mengalihkan..."
      );

      /*
       * Beri waktu sedikit agar session
       * tersimpan di browser.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      router.replace("/");

      router.refresh();
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err instanceof Error) {
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

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* HEADER */}

            <div className="px-7 pb-6 pt-8 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <LogIn
                  size={30}
                  className="text-white"
                />
              </div>

              <h1 className="mt-5 text-2xl font-black tracking-tight text-white">
                Otsuka Sales
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Masuk ke akun sales Anda
              </p>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleLogin}
              className="px-7 pb-8"
            >

              {/* ERROR */}

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {error}
                  </span>
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  <CheckCircle2
                    size={18}
                    className="shrink-0"
                  />

                  <span>
                    {success}
                  </span>
                </div>
              )}

              {/* USERNAME */}

              <div className="mb-5">
                <label
                  htmlFor="username"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  Username
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                      )}
                    placeholder="Masukkan username"
                    autoComplete="username"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 pl-11 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 pl-11 pr-12 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )}
                    disabled={loading}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
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

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={
                  loading ||
                  !username.trim() ||
                  !password
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />

                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />

                    Masuk
                  </>
                )}
              </button>

              {/* FOOTER */}

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  Otsuka Sales Management
                </p>

                <p className="mt-1 text-[10px] text-slate-600">
                  Sistem internal sales
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}