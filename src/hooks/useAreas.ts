import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { areasRepo } from "@/repositories/areasRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { Area } from "@/types/pokleh";

export const useAreas = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAreas = useCallback(async () => {
    try {
      const { data, error } = await areasRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as Area[];
      setAreas(result);
      await db.areas.bulkPut(result.map((a) => ({ ...a, syncedAt: new Date().toISOString() })));
    } catch (err) {
      const cached = await db.areas.toArray();
      if (cached.length > 0) {
        setAreas(cached as Area[]);
      }
    }
  }, []);

  const addArea = async (name: string) => {
    const { data, error } = await areasRepo.create({ name });
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    const area = data as Area;
    await db.areas.put({ ...area, syncedAt: new Date().toISOString() });
    setAreas((prev) => [...prev, area]);
    toast.success("Area created");
    return { success: true };
  };

  const updateArea = async (id: string, name: string) => {
    const { error } = await areasRepo.update(id, { name });
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
    await db.areas.put({ id, name, syncedAt: new Date().toISOString() } as Area & { syncedAt: string });
    toast.success("Area updated");
    return { success: true };
  };

  const deleteArea = async (id: string) => {
    const { error } = await areasRepo.delete(id);
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    setAreas((prev) => prev.filter((a) => a.id !== id));
    await db.areas.delete(id);
    toast.success("Area deleted");
    return { success: true };
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchAreas().finally(() => setLoading(false));
  }, [fetchAreas, refreshTick]);

  return { areas, loading, addArea, updateArea, deleteArea, refresh: fetchAreas };
};
