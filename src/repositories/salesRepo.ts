import { supabase } from "@/integrations/supabase/client";

// Fetch sales with nested distribution -> intake -> supplier chain so that
// daily bills can resolve cost_per_pax + supplier for carry-forward stock
// (stock intake on day 1, sold on day 2). Without this chain the daily bill
// falls back to matching intake_date === sale_date, which misses carried-
// forward stock and reports cost_per_pax = 0 / supplier = "Unknown".
const SALES_WITH_RELATIONS =
  "*, customer:customers(*), truck:trucks(*), staff:profiles!sales_staff_id_fkey(*), distribution:stock_distribution(*, intake:stock_intake(*, supplier:suppliers(*)))";

export const salesRepo = {
  fetchAll: () =>
    supabase.from("sales").select(SALES_WITH_RELATIONS).order("sale_date", { ascending: false }),
  create: (data: Record<string, unknown>) =>
    supabase.from("sales").insert(data).select(SALES_WITH_RELATIONS).single(),
};
