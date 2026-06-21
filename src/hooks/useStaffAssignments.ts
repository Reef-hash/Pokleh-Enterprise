import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { StaffAreaAssignment } from "@/types/pokleh";

export const useStaffAssignments = () => {
  const [assignments, setAssignments] = useState<StaffAreaAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("staff_area_assignments")
        .select("*, area:areas(*), profile:profiles!staff_id(*)")
        .order("assigned_date", { ascending: false });
      if (error) throw error;
      setAssignments((data || []) as unknown as StaffAreaAssignment[]);
    } catch {
      // offline fallback
    }
  }, []);

  const assignStaff = async (staffId: string, areaId: string) => {
    const { data, error } = await supabase
      .from("staff_area_assignments")
      .insert({ staff_id: staffId, area_id: areaId })
      .select("*, area:areas(*), profile:profiles!staff_id(*)")
      .single();
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    setAssignments((prev) => [data as unknown as StaffAreaAssignment, ...prev]);
    toast.success("Staff assigned to area");
    return { success: true };
  };

  const endAssignment = async (id: string) => {
    const { error } = await supabase
      .from("staff_area_assignments")
      .update({ ended_date: new Date().toISOString().split("T")[0] })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ended_date: new Date().toISOString().split("T")[0] } : a
      )
    );
    toast.success("Assignment ended");
    return { success: true };
  };

  useEffect(() => {
    fetchAssignments().finally(() => setLoading(false));
  }, [fetchAssignments]);

  return { assignments, loading, assignStaff, endAssignment, refresh: fetchAssignments };
};
