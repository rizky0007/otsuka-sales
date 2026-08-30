"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log("=== SUPABASE PRODUCTION DEBUG ===");
console.log("URL:", supabaseUrl);
console.log(
  "KEY PREFIX:",
  supabaseKey ? supabaseKey.substring(0, 20) : "MISSING"
);
console.log(
  "KEY LENGTH:",
  supabaseKey ? supabaseKey.length : 0
);

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL tidak ditemukan");
}

if (!supabaseKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tidak ditemukan"
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);