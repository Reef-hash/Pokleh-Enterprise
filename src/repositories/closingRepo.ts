import { supabase } from "@/integrations/supabase/client";
export const closingRepo = {
  fetchAll: () => supabase.from("daily_closings").select("*, truck:trucks(*)").order("closing_date", { ascending: false }),
  closeOrReconcile: (data: { p_closing_date: string; p_truck_id: string; p_product_type: string; p_user_id: string; p_action: string }) => supabase.rpc("perform_daily_closing", data),
};
