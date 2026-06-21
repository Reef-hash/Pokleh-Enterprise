import { supabase } from "@/integrations/supabase/client";
export const expensesRepo = {
  fetchAll: () => supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
  create: (data: Record<string, unknown>) => supabase.from("expenses").insert(data).select("*").single(),
};
