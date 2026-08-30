import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL tidak tersedia."
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tidak tersedia."
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
}