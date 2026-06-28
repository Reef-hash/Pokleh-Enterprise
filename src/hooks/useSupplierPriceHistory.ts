import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { priceHistoryRepo } from "@/repositories/suppliersRepo";
import { db } from "@/lib/db";
import { mergeUnSyncedData } from "@/lib/writeHelper";
import { toast } from "sonner";
import type { SupplierPriceHistory } from "@/types/pokleh";

export const useSupplierPriceHistory = () => {
  const [history, setHistory] = useState<SupplierPriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshTick = useSyncStore((s) => s.refreshTick);
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);

  const fetchHistory = useCallback(async () => {
    try {
      const { data, error } = await priceHistoryRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as SupplierPriceHistory[];
      const merged = await mergeUnSyncedData("supplier_price_history", result);
      setHistory(merged);
      await db.supplierPriceHistory.bulkPut(merged as unknown as import("@/lib/db").OfflineSupplierPriceHistory[]);
    } catch {
      const cached = await db.supplierPriceHistory.orderBy("effective_date").reverse().toArray();
      setHistory(cached as unknown as SupplierPriceHistory[]);
    }
  }, [triggerRefresh]);

  useEffect(() => {
    fetchHistory().finally(() => setLoading(false));
  }, [fetchHistory, refreshTick]);

  return { history, loading, refresh: fetchHistory };
};
