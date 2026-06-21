import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
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
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const today = now.split("T")[0];
    return persistWrite<StaffAreaAssignment>({
      entity: "staff_area_assignments",
      action: "INSERT",
      userId: "system",
      data: { staff_id: staffId, area_id: areaId },
      execute: () => staffAssignmentsRepo.create({ staff_id: staffId, area_id: areaId }),
      optimistic: {
        add: () =>
          setAssignments((prev) => [
            {
              id: tempId,
              staff_id: staffId,
              area_id: areaId,
              assigned_date: today,
              ended_date: null,
              created_at: now,
            } as StaffAreaAssignment,
            ...prev,
          ]),
        remove: () => setAssignments((prev) => prev.filter((a) => a.id !== tempId)),
      },
      onSuccess: (assignment) =>
        setAssignments((prev) => prev.map((a) => (a.id === tempId ? assignment : a))),
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

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchAssignments().finally(() => setLoading(false));
  }, [fetchAssignments, refreshTick]);

  return { assignments, loading, assignStaff, endAssignment, refresh: fetchAssignments };
};
