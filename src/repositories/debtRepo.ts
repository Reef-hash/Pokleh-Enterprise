import { supabase } from "@/integrations/supabase/client";
export const debtLedgerRepo = {
  fetchAll: () => supabase.from("debt_ledger").select("*, customer:customers(*)").order("created_at", { ascending: false }),
  create: (data: Record<string, unknown>) => supabase.from("debt_ledger").insert(data),
};
export const debtCollectionRepo = {
  fetchAll: () => supabase.from("debt_collection").select("*, customer:customers(*), staff:profiles!debt_collection_staff_id_fkey(*)").order("collection_date", { ascending: false }),
  create: (data: Record<string, unknown>) => supabase.from("debt_collection").insert(data).select("*, customer:customers(*), staff:profiles!debt_collection_staff_id_fkey(*)").single(),
};
