import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { trucksRepo } from "@/repositories/trucksRepo";
import { db } from "@/lib/db";
import { toast } from "sonner";
import type { Truck } from "@/types/pokleh";

export const useTrucks = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrucks = useCallback(async () => {
    try {
      const { data, error } = await trucksRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as Truck[];
      setTrucks(result);
      await db.trucks.bulkPut(result.map((t) => ({ ...t, syncedAt: new Date().toISOString() })));
    } catch (err) {
      const cached = await db.trucks.toArray();
      if (cached.length > 0) {
        setTrucks(cached as Truck[]);
      }
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
