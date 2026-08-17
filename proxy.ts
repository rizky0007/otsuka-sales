import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // =====================================================
  // API TIDAK BOLEH DICEGAT PROXY
  // =====================================================
  //
  // Khususnya:
  //
  // POST /api/auth/login
  //
  // API login harus bisa diakses ketika user BELUM login.
  //

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // =====================================================
  // ROUTE PUBLIC
  // =====================================================

  const publicPaths = [
    "/login",
    "/register",
  ];

  const isPublicPath =
    publicPaths.includes(pathname);

  // =====================================================
  // RESPONSE AWAL
  // =====================================================

  let response = NextResponse.next({
    request,
  });

  // =====================================================
  // SUPABASE ENV
  // =====================================================

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "[PROXY] Supabase environment variables tidak ditemukan."
    );

    return new NextResponse(
      "Supabase environment variables belum dikonfigurasi.",
      {
        status: 500,
      }
    );
  }

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

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              );
            }
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  // =====================================================
  // CEK USER
  // =====================================================

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.log(
      "[PROXY] Auth check:",
      error.message
    );
  }

  // =====================================================
  // BELUM LOGIN
  // =====================================================

  if (!user && !isPublicPath) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";

    return NextResponse.redirect(
      loginUrl
    );
  }

  // =====================================================
  // SUDAH LOGIN
  // =====================================================

  if (
    user &&
    (pathname === "/login" ||
      pathname === "/register")
  ) {
    const dashboardUrl =
      request.nextUrl.clone();

    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";

    return NextResponse.redirect(
      dashboardUrl
    );
  }

  // =====================================================
  // LANJUTKAN REQUEST
  // =====================================================

  return response;
}

// =======================================================
// MATCHER
// =======================================================
//
// API sengaja dikeluarkan dari matcher.
//
// Jadi:
//
// /api/auth/login
// /api/...
//
// tidak diproses oleh proxy.
//

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};