import { supabase } from "@/integrations/supabase/client";

// Fetch wastage with nested intake -> supplier so daily bills can resolve
// cost_per_pax + supplier for carry-forward stock (intake on day 1, wasted on
// day 2). Without the supplier chain, supplierName falls back to "Unknown".
const WASTAGE_WITH_RELATIONS =
  "*, truck:trucks(*), intake:stock_intake(*, supplier:suppliers(*))";

// Stock Wastage
export const wastageRepo = {
  fetchAll: (truckId?: string, fromDate?: string, toDate?: string) => {
    let q = supabase.from("stock_wastage").select(WASTAGE_WITH_RELATIONS);
    if (truckId) q = q.eq("truck_id", truckId);
    if (fromDate) q = q.gte("waste_date", fromDate);
    if (toDate) q = q.lte("waste_date", toDate);
    return q.order("waste_date", { ascending: false });
  },
  create: (data: Record<string, unknown>) =>
    supabase.from("stock_wastage").insert(data).select(WASTAGE_WITH_RELATIONS).single(),
  fetchByIntake: (intakeId: string) =>
    supabase.from("stock_wastage").select("*").eq("intake_id", intakeId),
  fetchByTruckAndDate: (truckId: string, date: string) =>
    supabase.from("stock_wastage").select("*").eq("truck_id", truckId).eq("waste_date", date),
};

// Wastage Adjustments
export const wastageAdjustmentRepo = {
  fetchAll: () =>
    supabase.from("wastage_adjustments").select("*, intake:stock_intake(*), truck:trucks(*)").order("adjustment_date", { ascending: false }),
  create: (data: Record<string, unknown>) =>
    supabase.from("wastage_adjustments").insert(data).select("*, intake:stock_intake(*), truck:trucks(*)").single(),
  fetchByIntake: (intakeId: string) =>
    supabase.from("wastage_adjustments").select("*").eq("intake_id", intakeId),
  approve: (id: string, data: Record<string, unknown>) =>
    supabase.from("wastage_adjustments").update(data).eq("id", id),
};
