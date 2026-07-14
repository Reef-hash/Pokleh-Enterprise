import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { sellingPriceRepo } from "@/repositories/sellingPriceRepo";
import { mergeUnSyncedData } from "@/lib/writeHelper";
import { blockIfBillingLocked } from "@/lib/billingLock";
import { toast } from "sonner";
import type { SellingPrice, ProductType } from "@/types/pokleh";

export const useSellingPrices = () => {
  const [prices, setPrices] = useState<SellingPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshTick = useSyncStore((s) => s.refreshTick);
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);

  const fetchPrices = useCallback(async () => {
    const { data, error } = await sellingPriceRepo.fetchAll();
    if (!error && data) {
      const merged = await mergeUnSyncedData("selling_prices", data as unknown as SellingPrice[]);
      setPrices(merged);
    }
  }, []);

  useEffect(() => {
    fetchPrices().finally(() => setLoading(false));
  }, [fetchPrices, refreshTick]);

  /** Lookup selling price per pax for a customer + product. Falls back to default. */
  const lookupPrice = (customerId: string | null, productType: ProductType): number | null => {
    if (customerId) {
      const specific = prices.find(
        (p) => p.customer_id === customerId && p.product_type === productType
      );
      if (specific) return specific.price_per_pax;
    }
    const def = prices.find((p) => p.customer_id === null && p.product_type === productType);
    return def?.price_per_pax ?? null;
  };

  const setPrice = async (data: {
    id?: string;
    product_type: ProductType;
    customer_id: string | null;
    price_per_pax: number;
    notes?: string | null;
  }) => {
    if (blockIfBillingLocked()) return { success: false };
    const { data: result, error } = await sellingPriceRepo.setPrice(data);
    if (error) { toast.error("Gagal simpan harga"); return { success: false }; }
    const updated = result as unknown as SellingPrice;
    setPrices((prev) => {
      const exists = prev.findIndex((p) => p.id === updated.id);
      if (exists >= 0) { const n = [...prev]; n[exists] = updated; return n; }
      return [...prev, updated];
    });
    toast.success("Harga disimpan");
    await triggerRefresh();
    return { success: true };
  };

  const deletePrice = async (id: string) => {
    if (blockIfBillingLocked()) return;
    const { error } = await sellingPriceRepo.delete(id);
    if (error) { toast.error("Gagal padam"); return; }
    setPrices((prev) => prev.filter((p) => p.id !== id));
    toast.success("Harga dihapus");
  };

  return { prices, loading, lookupPrice, setPrice, deletePrice, refresh: fetchPrices };
};
