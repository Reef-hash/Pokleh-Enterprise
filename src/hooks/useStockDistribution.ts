import { useState, useEffect, useCallback } from "react";
import { stockDistributionRepo } from "@/repositories/stockRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { persistWrite } from "@/lib/writeHelper";
import type { StockDistribution } from "@/types/pokleh";

export const useStockDistribution = (intakeId?: string) => {
  const [distributions, setDistributions] = useState<StockDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchDistributions = useCallback(async () => {
    try {
      const { data, error } = await stockDistributionRepo.fetchAll(intakeId);
      if (error) throw error;
      const result = (data || []) as unknown as StockDistribution[];
      setDistributions(result);
      await db.stockDistributions.bulkPut(result as unknown as import("@/lib/db").OfflineStockDistribution[]);
    } catch {
      const cached = await db.stockDistributions.orderBy("created_at").reverse().toArray();
      if (cached.length > 0) setDistributions(cached as unknown as StockDistribution[]);
    }
  }, [intakeId]);

  const addDistribution = async (data: {
    intake_id: string;
    area_id: string;
    quantity_assigned: number;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    return persistWrite<StockDistribution>({
      entity: "stock_distribution",
      action: "INSERT",
      userId,
      data: { ...data, created_by: userId },
      execute: () => stockDistributionRepo.create({ ...data, created_by: userId }),
      optimistic: {
        add: () =>
          setDistributions((prev) => [
            {
              id: tempId,
              intake_id: data.intake_id,
              area_id: data.area_id,
              quantity_assigned: data.quantity_assigned,
              created_by: userId!,
              created_at: now,
            } as StockDistribution,
            ...prev,
          ]),
        remove: () => setDistributions((prev) => prev.filter((d) => d.id !== tempId)),
      },
      onSuccess: (dist) =>
        setDistributions((prev) => prev.map((d) => (d.id === tempId ? dist : d))),
      dexiePut: (dist) =>
        db.stockDistributions.put(dist as unknown as import("@/lib/db").OfflineStockDistribution),
      msg: "Stock distributed",
    });
  };

  useEffect(() => {
    fetchDistributions().finally(() => setLoading(false));
  }, [fetchDistributions]);

  return { distributions, loading, addDistribution, refresh: fetchDistributions };
};
