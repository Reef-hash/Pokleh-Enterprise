import { supabase } from "@/integrations/supabase/client";
export const areasRepo = {
  fetchAll: () => supabase.from("areas").select("*").order("name"),
  create: (data: { name: string }) => supabase.from("areas").insert(data).select().single(),
  update: (id: string, data: { name: string }) => supabase.from("areas").update(data).eq("id", id),
  delete: (id: string) => supabase.from("areas").delete().eq("id", id),
};
