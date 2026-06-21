import { useState, useEffect, useCallback } from "react";
import { staffAssignmentsRepo, profilesRepo } from "@/repositories/staffRepo";
import { persistWrite } from "@/lib/writeHelper";
import type { StaffAreaAssignment } from "@/types/pokleh";

export const useStaffAssignments = () => {
  const [assignments, setAssignments] = useState<StaffAreaAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await staffAssignmentsRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as StaffAreaAssignment[];
      setAssignments(result);
    } catch {
      // offline fallback
    }
  }, []);

  const assignStaff = async (staffId: string, areaId: string) => {
    return persistWrite<StaffAreaAssignment>({
      entity: "staff_area_assignments",
      action: "INSERT",
      userId: "system",
      data: { staff_id: staffId, area_id: areaId },
      execute: () => staffAssignmentsRepo.create({ staff_id: staffId, area_id: areaId }),
      onSuccess: (assignment) => setAssignments((prev) => [assignment, ...prev]),
      msg: "Staff assigned to area",
    });
  };

  const endAssignment = async (id: string) => {
    const endedDate = new Date().toISOString().split("T")[0];
    return persistWrite<StaffAreaAssignment>({
      entity: "staff_area_assignments",
      action: "UPDATE",
      userId: "system",
      id,
      data: { ended_date: endedDate },
      execute: async () => {
        const { error } = await staffAssignmentsRepo.end(id, endedDate);
        if (error) return { data: null, error };
        return { data: { id, ended_date: endedDate } as unknown as StaffAreaAssignment, error: undefined };
      },
      onSuccess: () =>
        setAssignments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ended_date: endedDate } : a))
        ),
      msg: "Assignment ended",
    });
  };

  useEffect(() => {
    fetchAssignments().finally(() => setLoading(false));
  }, [fetchAssignments]);

  return { assignments, loading, assignStaff, endAssignment, refresh: fetchAssignments };
};
