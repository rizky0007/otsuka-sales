import { createClient } from "@/lib/supabase/client";


// =========================================================
// GET PRODUCTS
// =========================================================

export async function getProducts() {
  const supabase = createClient();

  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    throw error;
  }

  return data ?? [];
}


// =========================================================
// GET MONTHLY TARGET
// =========================================================

export async function getMonthlyTargets(
  month: string
) {
  const supabase = createClient();

  const firstDay =
    `${month}-01`;

  const {
    data,
    error,
  } = await supabase
    .from("monthly_targets")
    .select(`
      *,
      products (
        id,
        code,
        name,
        icon
      )
    `)
    .eq("month", firstDay);

  if (error) {
    throw error;
  }

  return data ?? [];
}


// =========================================================
// SAVE MONTHLY TARGET
// =========================================================

export async function saveMonthlyTarget(
  productId: string,
  month: string,
  targetValue: number,
  workingDays: number
) {
  const supabase = createClient();

  const {
    error,
  } = await supabase
    .from("monthly_targets")
    .upsert(
      {
        product_id: productId,

        month:
          `${month}-01`,

        target_value:
          targetValue,

        working_days:
          workingDays,

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "product_id,month",
      }
    );

  if (error) {
    throw error;
  }
}


// =========================================================
// GET DAILY VALUES
// =========================================================

export async function getDailyValues(
  month: string
) {
  const supabase = createClient();

  const start =
    `${month}-01`;

  const [year, monthNumber] =
    month.split("-");

  const nextMonth =
    new Date(
      Number(year),
      Number(monthNumber),
      1
    );

  const end =
    nextMonth
      .toISOString()
      .split("T")[0];

  const {
    data,
    error,
  } = await supabase
    .from("daily_values")
    .select(`
      *,
      products (
        id,
        code,
        name,
        icon
      )
    `)
    .gte("date", start)
    .lt("date", end)
    .order("date", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}


// =========================================================
// SAVE DAILY VALUE
// =========================================================

export async function saveDailyValue(
  productId: string,
  date: string,
  value: number
) {
  const supabase = createClient();

  const {
    error,
  } = await supabase
    .from("daily_values")
    .upsert(
      {
        product_id:
          productId,

        date,

        value,

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "product_id,date",
      }
    );

  if (error) {
    throw error;
  }
}


// =========================================================
// SAVE ONE DAY
// =========================================================

export async function saveDailyUpdate(
  date: string,
  values: {
    productId: string;
    value: number;
  }[],
  note?: string
) {
  const supabase = createClient();

  // Save product values
  const rows = values.map(
    (item) => ({
      product_id:
        item.productId,

      date,

      value:
        item.value,

      updated_at:
        new Date().toISOString(),
    })
  );

  const {
    error: valueError,
  } = await supabase
    .from("daily_values")
    .upsert(
      rows,
      {
        onConflict:
          "product_id,date",
      }
    );

  if (valueError) {
    throw valueError;
  }

  // Calculate total
  const total =
    values.reduce(
      (sum, item) =>
        sum + Number(item.value || 0),
      0
    );

  // Save update log
  const {
    error: historyError,
  } = await supabase
    .from("daily_updates")
    .insert({
      update_date:
        date,

      total_value:
        total,

      note:
        note ?? null,
    });

  if (historyError) {
    throw historyError;
  }

  return {
    total,
  };
}