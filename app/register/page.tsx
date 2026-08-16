"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserPlus,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const supabase = createClient();

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanUsername = username.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      setError("Username wajib diisi.");
      return;
    }

    if (!fullName.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    if (!cleanEmail) {
      setError("Email wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);

    try {
      // =====================================================
      // CEK USERNAME
      // =====================================================

      const { data: existingUsername, error: usernameError } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleanUsername)
          .maybeSingle();

      if (usernameError) {
        throw new Error(usernameError.message);
      }

      if (existingUsername) {
        throw new Error("Username sudah digunakan.");
      }

      // =====================================================
      // BUAT AKUN SUPABASE AUTH
      // =====================================================

      const { data, error: authError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
              full_name: fullName.trim(),
            },
          },
        });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!data.user) {
        throw new Error(
          "Akun gagal dibuat. Silakan coba lagi."
        );
      }

      // =====================================================
      // SIMPAN PROFILE
      // =====================================================

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          username: cleanUsername,
          email: cleanEmail,
          full_name: fullName.trim(),
          role: "sales",
          active: true,
        });

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);

        throw new Error(
          `Akun Auth berhasil dibuat, tetapi profile gagal disimpan: ${profileError.message}`
        );
      }

      // =====================================================
      // BERHASIL
      // =====================================================

      setSuccess(
        "Akun berhasil dibuat. Silakan login menggunakan username dan password kamu."
      );

      setUsername("");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuat akun."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <div className="w-full">

          {/* CARD */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">

            {/* HEADER */}
            <div className="mb-7 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <UserPlus size={26} />
              </div>

              <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
                Buat Akun
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Buat akun sales Otsuka kamu
              </p>

            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{success}</span>
                </div>

                <Link
                  href="/login"
                  className="mt-3 inline-block font-bold text-emerald-800 underline"
                >
                  Kembali ke halaman login
                </Link>
              </div>
            )}

            {/* FORM */}
            {!success && (
              <form
                onSubmit={handleRegister}
                className="space-y-4"
              >

                {/* USERNAME */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Username
                  </label>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                          .toUpperCase()
                          .replace(/\s/g, "")
                      )
                    }
                    placeholder="Contoh: TORT04"
                    autoComplete="username"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                {/* NAMA */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Nama Lengkap
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Nama lengkap"
                    autoComplete="name"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="nama@email.com"
                    autoComplete="email"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Password
                  </label>

                  <div className="relative">
                    <input
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
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Konfirmasi Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showConfirm
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Ulangi password"
                      autoComplete="new-password"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirm(
                          !showConfirm
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirm ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Membuat akun...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Buat Akun
                    </>
                  )}
                </button>

              </form>
            )}

            {/* BACK TO LOGIN */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-center">

              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
              >
                <ArrowLeft size={16} />
                Sudah punya akun? Login
              </Link>

            </div>

          </div>

          {/* FOOTER */}
          <p className="mt-5 text-center text-xs text-slate-400">
            Otsuka Sales Management
          </p>

        </div>
      </div>
    </main>
  );
}