import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];

  try {
    // =====================================================
    // SUPABASE ENV
    // =====================================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "[LOGIN] Supabase environment belum tersedia"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Konfigurasi Supabase belum tersedia.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // REQUEST
    // =====================================================

    let body: {
      username?: unknown;
      password?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Data login tidak valid.",
        },
        { status: 400 }
      );
    }

    const username =
      typeof body.username === "string"
        ? body.username.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

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

    console.log(
      `[LOGIN] Mencoba login username: ${username}`
    );

    // =====================================================
    // SUPABASE SERVER CLIENT
    // =====================================================

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookies) {
            cookiesToSet.push(...cookies);
          },
        },
      }
    );

    // =====================================================
    // CARI EMAIL BERDASARKAN USERNAME
    // =====================================================

    const {
      data: email,
      error: lookupError,
    } = await supabase.rpc(
      "get_login_email",
      {
        p_username: username,
      }
    );

    if (lookupError) {
      console.error(
        "[LOGIN] RPC ERROR:",
        lookupError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mencari akun. " +
            lookupError.message,
        },
        { status: 500 }
      );
    }

    if (!email) {
      console.log(
        `[LOGIN] Username tidak ditemukan: ${username}`
      );

      return NextResponse.json(
        {
          success: false,
          message: "Username tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    console.log(
      `[LOGIN] Email ditemukan: ${String(email)}`
    );

    // =====================================================
    // LOGIN SUPABASE AUTH
    // =====================================================

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
        "[LOGIN] AUTH ERROR:",
        authError.message
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

    if (!authData.user || !authData.session) {
      console.error(
        "[LOGIN] User/session tidak tersedia"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Session login tidak berhasil dibuat.",
        },
        { status: 401 }
      );
    }

    console.log(
      "[LOGIN] Auth berhasil:",
      authData.user.id
    );

    console.log(
      "[LOGIN] Cookie yang akan disimpan:",
      cookiesToSet.length
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil.",
        user: {
          id: authData.user.id,
          email:
            authData.user.email ?? null,
        },
      },
      {
        status: 200,
      }
    );

    // =====================================================
    // SIMPAN COOKIE SUPABASE
    // =====================================================

    for (const cookie of cookiesToSet) {
      response.cookies.set(
        cookie.name,
        cookie.value,
        cookie.options as Parameters<
          typeof response.cookies.set
        >[2]
      );
    }

    console.log(
      `[LOGIN] Login berhasil untuk ${username}`
    );

    return response;
  } catch (error) {
    console.error(
      "[LOGIN] UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}