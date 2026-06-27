import { supabase } from "@/integrations/supabase/client";
export const customersRepo = {
  fetchAll: (truckId?: string) => { let q = supabase.from("customers").select("*, truck:trucks(*)").order("name"); if (truckId) q = q.eq("truck_id", truckId); return q; },
  create: (data: { name: string; phone?: string; address?: string; truck_id: string }) => supabase.from("customers").insert(data).select("*, truck:trucks(*)").single(),
  update: (id: string, updates: Record<string, unknown>) => supabase.from("customers").update(updates).eq("id", id).select("*, truck:trucks(*)").single(),
  fetchBalance: (id: string) => supabase.from("customers").select("debt_balance").eq("id", id).single(),
};
