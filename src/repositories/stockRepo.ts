import { supabase } from "@/integrations/supabase/client";
// Stock Intake
export const stockIntakeRepo = {
  fetchAll: () => supabase.from("stock_intake").select("*, supplier:suppliers(*)").order("intake_date", { ascending: false }),
  create: (data: Record<string, unknown>) => supabase.from("stock_intake").insert(data).select("*, supplier:suppliers(*)").single(),
  fetchById: (intakeId: string) => supabase.from("stock_intake").select("cost_per_pax, quantity_received").eq("id", intakeId).single(),
};
// Stock Distribution
export const stockDistributionRepo = {
  fetchAll: (intakeId?: string) => { let q = supabase.from("stock_distribution").select("*, intake:stock_intake(*), area:areas(*)"); if (intakeId) q = q.eq("intake_id", intakeId); return q.order("created_at", { ascending: false }); },
  create: (data: Record<string, unknown>) => supabase.from("stock_distribution").insert(data).select("*, intake:stock_intake(*), area:areas(*)").single(),
  fetchQuantities: () => supabase.from("stock_distribution").select("intake_id, quantity_assigned"),
};
// Stock Return
export const stockReturnRepo = {
  fetchAll: (areaId?: string) => { let q = supabase.from("stock_return").select("*, distribution:stock_distribution(*, area:areas(*)), area:areas(*)").order("return_date", { ascending: false }); if (areaId) q = q.eq("area_id", areaId); return q; },
  create: (data: Record<string, unknown>) => supabase.from("stock_return").insert(data).select("*, distribution:stock_distribution(*, area:areas(*)), area:areas(*)").single(),
};
