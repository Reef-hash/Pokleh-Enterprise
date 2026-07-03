import { supabase } from "@/integrations/supabase/client";

export const suppliersRepo = {
  fetchAll: () => supabase.from("suppliers").select("*").order("name"),
  create: (data: Record<string, unknown>) => supabase.from("suppliers").insert(data).select().single(),
  update: (id: string, data: Record<string, unknown>) => supabase.from("suppliers").update(data).eq("id", id).select().single(),
  delete: (id: string) => supabase.from("suppliers").delete().eq("id", id),
};

// Supplier price history — one row per supplier + product + effective_date.
// The intake form looks up the latest price where effective_date <= today for
// the chosen supplier + product, so drivers only enter quantity.
export const priceHistoryRepo = {
  fetchAll: () =>
    supabase
      .from("supplier_price_history")
      .select("*, supplier:suppliers(name)")
      .order("effective_date", { ascending: false }),
  fetchBySupplier: (supplierId: string) =>
    supabase
      .from("supplier_price_history")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("effective_date", { ascending: false }),
  // Insert a new price record (append-only history). The unique index on
  // (supplier_id, product_type, effective_date) prevents duplicates for the
  // same date; call with today's date to set a new "current" price.
  upsertPrice: (data: { supplier_id: string; product_type: string; cost_per_pax: number; effective_date: string }) =>
    supabase
      .from("supplier_price_history")
      .insert(data)
      .select("*")
      .single(),
};
