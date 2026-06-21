import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { stockIntakeRepo } from "@/repositories/stockRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { persistWrite } from "@/lib/writeHelper";
import type { StockIntake } from "@/types/pokleh";

export const useStockIntake = () => {
  const [intakes, setIntakes] = useState<StockIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchIntakes = useCallback(async () => {
    try {
      const { data, error } = await stockIntakeRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as StockIntake[];
      setIntakes(result);
      await db.stockIntakes.bulkPut(result as unknown as import("@/lib/db").OfflineStockIntake[]);
    } catch {
      const cached = await db.stockIntakes.orderBy("intake_date").reverse().toArray();
      if (cached.length > 0) setIntakes(cached as unknown as StockIntake[]);
    }
  }, []);

  const addIntake = async (data: {
    intake_date: string;
    supplier_id: string;
    quantity_received: number;
    cost_per_pax: number;
    notes?: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: StockIntake = {
      id: tempId,
      intake_date: data.intake_date,
      supplier_id: data.supplier_id,
      quantity_received: data.quantity_received,
      cost_per_pax: data.cost_per_pax,
      notes: data.notes ?? null,
      created_by: userId!,
      created_at: now,
    } as StockIntake;
    return persistWrite<StockIntake>({
      entity: "stock_intake",
      action: "INSERT",
      userId,
      data: { ...data, created_by: userId },
      execute: () => stockIntakeRepo.create({ ...data, created_by: userId }),
      optimistic: {
        add: () => setIntakes((prev) => [optimistic, ...prev]),
        remove: () => setIntakes((prev) => prev.filter((i) => i.id !== tempId)),
      },
      onSuccess: (intake) =>
        setIntakes((prev) => prev.map((i) => (i.id === tempId ? intake : i))),
      dexiePut: (intake) =>
        db.stockIntakes.put(intake as unknown as import("@/lib/db").OfflineStockIntake),
      cacheOffline: async () => db.stockIntakes.put(optimistic as unknown as import("@/lib/db").OfflineStockIntake),
      msg: "Stock intake recorded",
    });
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchIntakes().finally(() => setLoading(false));
  }, [fetchIntakes, refreshTick]);

  return { intakes, loading, addIntake, refresh: fetchIntakes };
};
