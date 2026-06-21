import { supabase } from "@/integrations/supabase/client";
export const auditRepo = {
  fetchAll: (limit = 200) => supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit),
  fetchByEntity: (entity: string, limit = 200) => supabase.from("audit_logs").select("*").eq("entity", entity).order("created_at", { ascending: false }).limit(limit),
};
