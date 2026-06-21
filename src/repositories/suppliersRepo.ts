import { supabase } from "@/integrations/supabase/client";
export const suppliersRepo = {
  fetchAll: () => supabase.from("suppliers").select("*").order("name"),
  create: (data: Record<string, unknown>) => supabase.from("suppliers").insert(data).select().single(),
  update: (id: string, data: Record<string, unknown>) => supabase.from("suppliers").update(data).eq("id", id).select().single(),
  delete: (id: string) => supabase.from("suppliers").delete().eq("id", id),
};
export const priceHistoryRepo = {
  fetchAll: () => supabase.from("supplier_price_history").select("*").order("effective_date", { ascending: false }),
};
