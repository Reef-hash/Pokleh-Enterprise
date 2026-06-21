import { supabase } from "@/integrations/supabase/client";
export const customersRepo = {
  fetchAll: (areaId?: string) => { let q = supabase.from("customers").select("*, area:areas(*)").order("name"); if (areaId) q = q.eq("area_id", areaId); return q; },
  create: (data: { name: string; phone?: string; address?: string; area_id: string }) => supabase.from("customers").insert(data).select("*, area:areas(*)").single(),
  update: (id: string, updates: Record<string, unknown>) => supabase.from("customers").update(updates).eq("id", id).select("*, area:areas(*)").single(),
  fetchBalance: (id: string) => supabase.from("customers").select("debt_balance").eq("id", id).single(),
};
