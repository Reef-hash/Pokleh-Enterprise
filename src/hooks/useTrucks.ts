import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { trucksRepo } from "@/repositories/trucksRepo";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { mergeUnSyncedData } from "@/lib/writeHelper";
import type { Truck } from "@/types/pokleh";

export const useTrucks = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);

  const fetchTrucks = useCallback(async () => {
    // Show cached data immediately (if this page has been opened online
    // before) so it never blocks on the network; refresh silently
    // underneath and keep the cache showing if that refresh fails.
    const cached = await db.trucks.toArray();
    if (cached.length > 0) {
      setTrucks(cached as Truck[]);
      setLoading(false);
    }

    try {
      const { data, error } = await trucksRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as Truck[];
      const merged = await mergeUnSyncedData("trucks", result);
      setTrucks(merged);
      await db.trucks.bulkPut(merged.map((t) => ({ ...t, syncedAt: new Date().toISOString() })));
    } catch {
      // Network failed — cached data (if any) is already shown above.
    }
  }, []);

  const addTruck = async (name: string) => {
    const { data, error } = await trucksRepo.create({ name });
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    const truck = data as Truck;
    await db.trucks.put({ ...truck, syncedAt: new Date().toISOString() });
    setTrucks((prev) => [...prev, truck]);
    toast.success("Truck created");
    await triggerRefresh();
    return { success: true };
  };

  const updateTruck = async (id: string, name: string) => {
    const { error } = await trucksRepo.update(id, { name });
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    setTrucks((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
    await db.trucks.put({ id, name, syncedAt: new Date().toISOString() } as Truck & { syncedAt: string });
    toast.success("Truck updated");
    await triggerRefresh();
    return { success: true };
  };

  const deleteTruck = async (id: string) => {
    const { error } = await trucksRepo.delete(id);
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    setTrucks((prev) => prev.filter((t) => t.id !== id));
    await db.trucks.delete(id);
    toast.success("Truck deleted");
    return { success: true };
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchTrucks().finally(() => setLoading(false));
  }, [fetchTrucks, refreshTick]);

  return { trucks, loading, addTruck, updateTruck, deleteTruck, refresh: fetchTrucks };
};
