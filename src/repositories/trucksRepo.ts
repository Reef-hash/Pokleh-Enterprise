import { supabase } from "@/integrations/supabase/client";
export const trucksRepo = {
  fetchAll: () => supabase.from("trucks").select("*").order("name"),
  create: (data: { name: string }) => supabase.from("trucks").insert(data).select().single(),
  update: (id: string, data: { name: string }) => supabase.from("trucks").update(data).eq("id", id),
  delete: (id: string) => supabase.from("trucks").delete().eq("id", id),
};
