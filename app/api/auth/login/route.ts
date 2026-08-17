import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message: "Username wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password wajib diisi.",
        },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "SUPABASE ENVIRONMENT VARIABLES TIDAK TERSEDIA"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Konfigurasi Supabase di server belum tersedia.",
        },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(
                ({
                  name,
                  value,
                  options,
                }) => {
                  cookieStore.set(
                    name,
                    value,
                    options
                  );
                }
              );
            } catch (error) {
              console.error(
                "Gagal menyimpan cookie Supabase:",
                error
              );
            }
          },
        },
      }
    );

    /*
     * =====================================================
     * 1. CARI EMAIL BERDASARKAN USERNAME
     * =====================================================
     */

    const {
      data: email,
      error: lookupError,
    } = await supabase.rpc("get_login_email", {
      p_username: username,
    });

    console.log(
      "LOGIN USERNAME:",
      username
    );

    console.log(
      "LOGIN EMAIL:",
      email
    );

    if (lookupError) {
      console.error(
        "GET LOGIN EMAIL ERROR:",
        lookupError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mencari akun.",
          detail:
            process.env.NODE_ENV ===
            "development"
              ? lookupError.message
              : undefined,
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Username tidak ditemukan.",
        },
        { status: 401 }
      );
    }

    /*
     * =====================================================
     * 2. LOGIN SUPABASE AUTH
     * =====================================================
     */

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.signInWithPassword({
        email: String(email),
        password,
      });

    if (authError) {
      console.error(
        "SUPABASE AUTH ERROR:",
        authError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Username atau password salah.",
        },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Login gagal. User tidak ditemukan.",
        },
        { status: 401 }
      );
    }

    /*
     * =====================================================
     * 3. PASTIKAN SESSION TERBENTUK
     * =====================================================
     */

    const {
      data: sessionData,
    } = await supabase.auth.getSession();

    if (!sessionData.session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Session login tidak berhasil dibuat.",
        },
        { status: 401 }
      );
    }

    /*
     * =====================================================
     * 4. LOGIN BERHASIL
     * =====================================================
     */

    return NextResponse.json({
      success: true,
      message:
        "Login berhasil.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
        detail:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}