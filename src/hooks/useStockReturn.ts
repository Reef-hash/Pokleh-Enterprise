import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { stockReturnRepo } from "@/repositories/stockRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { persistWrite } from "@/lib/writeHelper";
import type { StockReturn } from "@/types/pokleh";

export const useStockReturn = (truckId?: string) => {
  const [returns, setReturns] = useState<StockReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchReturns = useCallback(async () => {
    try {
      const { data, error } = await stockReturnRepo.fetchAll(truckId);
      if (error) throw error;
      const result = (data || []) as unknown as StockReturn[];
      setReturns(result);
      await db.stockReturns.bulkPut(result as unknown as import("@/lib/db").OfflineStockReturn[]);
    } catch {
      const cached = await db.stockReturns.orderBy("return_date").reverse().toArray();
      if (cached.length > 0) setReturns(cached as unknown as StockReturn[]);
    }
  }, [truckId]);

  const addReturn = async (data: {
    distribution_id?: string;
    intake_id?: string;
    truck_id: string;
    quantity_returned: number;
    return_date: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: StockReturn = {
      id: tempId,
      distribution_id: data.distribution_id ?? null,
      intake_id: data.intake_id ?? null,
      truck_id: data.truck_id,
      quantity_returned: data.quantity_returned,
      return_date: data.return_date,
      created_by: userId!,
      created_at: now,
    } as StockReturn;
    return persistWrite<StockReturn>({
      entity: "stock_return",
      action: "INSERT",
      userId,
      data: { ...data, distribution_id: data.distribution_id ?? null, intake_id: data.intake_id ?? null, created_by: userId },
      execute: () => stockReturnRepo.create({ ...data, distribution_id: data.distribution_id ?? null, intake_id: data.intake_id ?? null, created_by: userId }),
      optimistic: {
        add: () => setReturns((prev) => [optimistic, ...prev]),
        remove: () => setReturns((prev) => prev.filter((r) => r.id !== tempId)),
      },
      onSuccess: (ret) =>
        setReturns((prev) => prev.map((r) => (r.id === tempId ? ret : r))),
      dexiePut: (ret) =>
        db.stockReturns.put(ret as unknown as import("@/lib/db").OfflineStockReturn),
      cacheOffline: async () => db.stockReturns.put(optimistic as unknown as import("@/lib/db").OfflineStockReturn),
      msg: "Stock return recorded",
    });
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchReturns().finally(() => setLoading(false));
  }, [fetchReturns, refreshTick]);

  return { returns, loading, addReturn, refresh: fetchReturns };
};
