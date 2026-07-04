import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { stockDistributionRepo } from "@/repositories/stockRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { persistWrite, mergeUnSyncedData } from "@/lib/writeHelper";
import type { StockDistribution, ProductType } from "@/types/pokleh";

export const useStockDistribution = (intakeId?: string) => {
  const [distributions, setDistributions] = useState<StockDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchDistributions = useCallback(async () => {
    // Show cached data immediately (if this page has been opened online
    // before) so it never blocks on the network; refresh silently
    // underneath and keep the cache showing if that refresh fails.
    const cached = await db.stockDistributions.orderBy("created_at").reverse().toArray();
    if (cached.length > 0) {
      setDistributions(cached as unknown as StockDistribution[]);
      setLoading(false);
    }

    try {
      const { data, error } = await stockDistributionRepo.fetchAll(intakeId);
      if (error) throw error;
      const result = (data || []) as unknown as StockDistribution[];
      const merged = await mergeUnSyncedData("stock_distribution", result);
      setDistributions(merged);
      await db.stockDistributions.bulkPut(merged as unknown as import("@/lib/db").OfflineStockDistribution[]);
    } catch {
      // Network failed — cached data (if any) is already shown above.
    }
  }, [intakeId]);

  const addDistribution = async (data: {
    intake_id?: string;
    from_truck_id: string;
    to_truck_id: string;
    product_type: ProductType;
    quantity_assigned: number;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: StockDistribution = {
      id: tempId,
      intake_id: data.intake_id ?? null,
      from_truck_id: data.from_truck_id,
      to_truck_id: data.to_truck_id,
      product_type: data.product_type,
      quantity_assigned: data.quantity_assigned,
      created_by: userId!,
      created_at: now,
    } as StockDistribution;
    return persistWrite<StockDistribution>({
      entity: "stock_distribution",
      action: "INSERT",
      userId,
      data: { ...data, intake_id: data.intake_id ?? null, created_by: userId },
      execute: () => stockDistributionRepo.create({ ...data, intake_id: data.intake_id ?? null, created_by: userId }),
      optimistic: {
        add: () => setDistributions((prev) => [optimistic, ...prev]),
        remove: () => setDistributions((prev) => prev.filter((d) => d.id !== tempId)),
      },
      onSuccess: (dist) =>
        setDistributions((prev) => prev.map((d) => (d.id === tempId ? dist : d))),
      dexiePut: (dist) =>
        db.stockDistributions.put(dist as unknown as import("@/lib/db").OfflineStockDistribution),
      cacheOffline: async () => db.stockDistributions.put(optimistic as unknown as import("@/lib/db").OfflineStockDistribution),
      msg: "Stock distributed",
    });
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchDistributions().finally(() => setLoading(false));
  }, [fetchDistributions, refreshTick]);

  return { distributions, loading, addDistribution, refresh: fetchDistributions };
};
