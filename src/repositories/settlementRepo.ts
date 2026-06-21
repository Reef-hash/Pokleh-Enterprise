import { supabase } from "@/integrations/supabase/client";
export const settlementRepo = {
  fetchAll: () => supabase.from("supplier_settlements").select("*, intake:stock_intake(*, supplier:suppliers(*))").order("created_at", { ascending: false }),
  upsert: (data: Record<string, unknown>) => supabase.from("supplier_settlements").insert(data).select("*, intake:stock_intake(*, supplier:suppliers(*))").single(),
  markSettled: (id: string, data: Record<string, unknown>) => supabase.from("supplier_settlements").update(data).eq("id", id),
  fetchExisting: (intakeId: string) => supabase.from("supplier_settlements").select("id").eq("intake_id", intakeId).maybeSingle(),
};
export const settlementRpc = {
  getTotalSold: (intakeId: string) => supabase.rpc("get_total_sold_for_intake", { p_intake_id: intakeId }),
  getTotalReturned: (intakeId: string) => supabase.rpc("get_total_returned_for_intake", { p_intake_id: intakeId }),
};
