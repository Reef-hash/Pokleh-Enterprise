import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { staffAssignmentsRepo, profilesRepo } from "@/repositories/staffRepo";
import { persistWrite } from "@/lib/writeHelper";
import type { StaffTruckAssignment } from "@/types/pokleh";

export const useStaffAssignments = () => {
  const [assignments, setAssignments] = useState<StaffTruckAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await staffAssignmentsRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as StaffTruckAssignment[];
      setAssignments(result);
    } catch {
      // offline fallback
    }
  }, []);

  const assignStaff = async (staffId: string, truckId: string) => {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const today = now.split("T")[0];
    return persistWrite<StaffTruckAssignment>({
      entity: "staff_truck_assignments",
      action: "INSERT",
      userId: "system",
      data: { staff_id: staffId, truck_id: truckId },
      execute: () => staffAssignmentsRepo.create({ staff_id: staffId, truck_id: truckId }),
      optimistic: {
        add: () =>
          setAssignments((prev) => [
            {
              id: tempId,
              staff_id: staffId,
              truck_id: truckId,
              assigned_date: today,
              ended_date: null,
              created_at: now,
            } as StaffTruckAssignment,
            ...prev,
          ]),
        remove: () => setAssignments((prev) => prev.filter((a) => a.id !== tempId)),
      },
      onSuccess: (assignment) =>
        setAssignments((prev) => prev.map((a) => (a.id === tempId ? assignment : a))),
      msg: "Staff assigned to truck",
    });
  };

  const endAssignment = async (id: string) => {
    const endedDate = new Date().toISOString().split("T")[0];
    return persistWrite<StaffTruckAssignment>({
      entity: "staff_truck_assignments",
      action: "UPDATE",
      userId: "system",
      id,
      data: { ended_date: endedDate },
      execute: async () => {
        const { error } = await staffAssignmentsRepo.end(id, endedDate);
        if (error) return { data: null, error };
        return { data: { id, ended_date: endedDate } as unknown as StaffTruckAssignment, error: undefined };
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
