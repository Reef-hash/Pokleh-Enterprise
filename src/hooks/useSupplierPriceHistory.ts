import { useState, useEffect, useCallback, useMemo } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { priceHistoryRepo } from "@/repositories/suppliersRepo";
import { db } from "@/lib/db";
import { mergeUnSyncedData } from "@/lib/writeHelper";
import { toast } from "sonner";
import type { SupplierPriceHistory, ProductType } from "@/types/pokleh";

export const useSupplierPriceHistory = () => {
  const [history, setHistory] = useState<SupplierPriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshTick = useSyncStore((s) => s.refreshTick);
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);

  const fetchHistory = useCallback(async () => {
    // Show cached data immediately (if this page has been opened online
    // before) so it never blocks on the network; refresh silently
    // underneath and keep the cache showing if that refresh fails.
    const cached = await db.supplierPriceHistory.orderBy("effective_date").reverse().toArray();
    if (cached.length > 0) {
      setHistory(cached as unknown as SupplierPriceHistory[]);
      setLoading(false);
    }

    try {
      const { data, error } = await priceHistoryRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as SupplierPriceHistory[];
      const merged = await mergeUnSyncedData("supplier_price_history", result);
      setHistory(merged);
      await db.supplierPriceHistory.bulkPut(merged as unknown as import("@/lib/db").OfflineSupplierPriceHistory[]);
    } catch {
      // Network failed — cached data (if any) is already shown above.
    }
  }, [triggerRefresh]);

  useEffect(() => {
    fetchHistory().finally(() => setLoading(false));
  }, [fetchHistory, refreshTick]);

  // Set (or update) the current price for a supplier + product. Creates a new
  // price-history row with today's effective_date so the audit trail is kept.
  const setPrice = useCallback(
    async (supplierId: string, productType: ProductType, costPerPax: number): Promise<boolean> => {
      const effective_date = new Date().toISOString().split("T")[0];
      try {
        const { data, error } = await priceHistoryRepo.upsertPrice({
          supplier_id: supplierId,
          product_type: productType,
          cost_per_pax: costPerPax,
          effective_date,
        });
        if (error) throw error;
        if (data) {
          const row = data as unknown as SupplierPriceHistory;
          setHistory((prev) => [row, ...prev]);
          await db.supplierPriceHistory.put(row as unknown as import("@/lib/db").OfflineSupplierPriceHistory);
        }
        triggerRefresh();
        toast.success("Harga pembekal dikemaskini");
        return true;
      } catch {
        toast.error("Gagal kemaskini harga pembekal");
        return false;
      }
    },
    [triggerRefresh]
  );

  // Returns the latest price (effective_date <= today) for a supplier + product,
  // or undefined if none set. Used by the Stock Intake form to auto-fill cost.
  const getLatestPrice = useCallback(
    (supplierId: string, productType: ProductType): number | undefined => {
      const today = new Date().toISOString().split("T")[0];
      const matching = history
        .filter((h) => h.supplier_id === supplierId && h.product_type === productType && h.effective_date <= today)
        .sort((a, b) => (a.effective_date < b.effective_date ? 1 : -1));
      return matching[0]?.cost_per_pax;
    },
    [history]
  );

  // Convenience map: for a given supplier, the current price per product.
  const pricesBySupplier = useMemo(() => {
    const map = new Map<string, Partial<Record<ProductType, number>>>();
    for (const supplierId of new Set(history.map((h) => h.supplier_id))) {
      const prices: Partial<Record<ProductType, number>> = {};
      for (const p of ["Air Batu Besar", "Air Batu Kecil", "Air Batu Hancur"] as ProductType[]) {
        const price = getLatestPrice(supplierId, p);
        if (price !== undefined) prices[p] = price;
      }
      map.set(supplierId, prices);
    }
    return map;
  }, [history, getLatestPrice]);

  return { history, loading, refresh: fetchHistory, setPrice, getLatestPrice, pricesBySupplier };
};
