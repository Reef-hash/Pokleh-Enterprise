import { supabase } from "@/integrations/supabase/client";
// Stock Intake
export const stockIntakeRepo = {
  fetchAll: () => supabase.from("stock_intake").select("*, supplier:suppliers(*), truck:trucks(*)").order("intake_date", { ascending: false }),
  create: (data: Record<string, unknown>) => supabase.from("stock_intake").insert(data).select("*, supplier:suppliers(*), truck:trucks(*)").single(),
  createMany: (rows: Record<string, unknown>[]) => supabase.from("stock_intake").insert(rows).select("*, supplier:suppliers(*), truck:trucks(*)"),
  fetchById: (intakeId: string) => supabase.from("stock_intake").select("cost_per_pax, quantity_received").eq("id", intakeId).single(),
};
// Stock Distribution (general truck-to-truck transfer)
const DISTRIBUTION_SELECT = "*, intake:stock_intake(*, supplier:suppliers(*)), from_truck:trucks!stock_distribution_from_truck_id_fkey(*), to_truck:trucks!stock_distribution_to_truck_id_fkey(*)";
export const stockDistributionRepo = {
  fetchAll: (intakeId?: string) => { let q = supabase.from("stock_distribution").select(DISTRIBUTION_SELECT); if (intakeId) q = q.eq("intake_id", intakeId); return q.order("created_at", { ascending: false }); },
  create: (data: Record<string, unknown>) => supabase.from("stock_distribution").insert(data).select(DISTRIBUTION_SELECT).single(),
  fetchQuantities: () => supabase.from("stock_distribution").select("intake_id, quantity_assigned"),
};
// Stock Return
export const stockReturnRepo = {
  fetchAll: (truckId?: string) => { let q = supabase.from("stock_return").select("*, distribution:stock_distribution(*), intake:stock_intake(*), truck:trucks(*)").order("return_date", { ascending: false }); if (truckId) q = q.eq("truck_id", truckId); return q; },
  create: (data: Record<string, unknown>) => supabase.from("stock_return").insert(data).select("*, distribution:stock_distribution(*), intake:stock_intake(*), truck:trucks(*)").single(),
};
// Truck available stock (intake + transfer_in - transfer_out - sold - returned, as of a date)
export const stockRpc = {
  getAvailableStock: (truckId: string, productType: string, asOfDate: string) =>
    supabase.rpc("get_truck_available_stock", { p_truck_id: truckId, p_product_type: productType, p_as_of_date: asOfDate }),
};
