import { supabase } from "@/integrations/supabase/client";
export const staffAssignmentsRepo = {
  fetchAll: () => supabase.from("staff_truck_assignments").select("*, truck:trucks(*), profile:profiles!staff_id(*)").order("assigned_date", { ascending: false }),
  create: (data: { staff_id: string; truck_id: string }) => supabase.from("staff_truck_assignments").insert(data).select("*, truck:trucks(*), profile:profiles!staff_id(*)").single(),
  end: (id: string, endedDate: string) => supabase.from("staff_truck_assignments").update({ ended_date: endedDate }).eq("id", id),
};
export const profilesRepo = {
  fetchStaff: () => supabase.from("profiles").select("*").eq("role", "staff").order("name"),
  fetchAll: () => supabase.from("profiles").select("*").order("created_at", { ascending: false }),
};
