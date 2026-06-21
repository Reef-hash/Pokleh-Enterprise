import { supabase } from "@/integrations/supabase/client";
export const salesRepo = {
  fetchAll: () => supabase.from("sales").select("*, customer:customers(*), area:areas(*), staff:profiles!sales_staff_id_fkey(*)").order("sale_date", { ascending: false }),
  create: (data: Record<string, unknown>) => supabase.from("sales").insert(data).select("*, customer:customers(*), area:areas(*), staff:profiles!sales_staff_id_fkey(*)").single(),
};
