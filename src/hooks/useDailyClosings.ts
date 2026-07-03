import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { closingRepo } from "@/repositories/closingRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { DailyClosing, ProductType } from "@/types/pokleh";
import { PRODUCT_TYPES } from "@/types/pokleh";

export const useDailyClosings = () => {
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchClosings = useCallback(async () => {
    try {
      const { data, error } = await closingRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as DailyClosing[];
      setClosings(result);
      await db.dailyClosings.bulkPut(result as unknown as import("@/lib/db").OfflineDailyClosing[]);
    } catch {
      const cached = await db.dailyClosings.orderBy("closing_date").reverse().toArray();
      setClosings(cached as unknown as DailyClosing[]);
    }
  }, []);

  const closeDay = async (closingDate: string, truckId: string, productType: ProductType) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const { data, error } = await closingRepo.closeOrReconcile({
      p_closing_date: closingDate,
      p_truck_id: truckId,
      p_product_type: productType,
      p_user_id: userId,
      p_action: "close",
    });
    if (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
    const closing = data as unknown as DailyClosing;
    setClosings((prev) => {
      const filtered = prev.filter((c) => c.id !== closing.id);
      return [closing, ...filtered];
    });
    await db.dailyClosings.put(closing as unknown as import("@/lib/db").OfflineDailyClosing);
    toast.success(`Day closed for ${new Date(closingDate).toLocaleDateString()}`);
    return { success: true, data: closing };
  };

  const reconcileDay = async (closingDate: string, truckId: string, productType: ProductType) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const { data, error } = await closingRepo.closeOrReconcile({
      p_closing_date: closingDate,
      p_truck_id: truckId,
      p_product_type: productType,
      p_user_id: userId,
      p_action: "reconcile",
    });
    if (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
    const closing = data as unknown as DailyClosing;
    setClosings((prev) => {
      const filtered = prev.filter((c) => c.id !== closing.id);
      return [closing, ...filtered];
    });
    await db.dailyClosings.put(closing as unknown as import("@/lib/db").OfflineDailyClosing);
    toast.success(`Day reconciled for ${new Date(closingDate).toLocaleDateString()}`);
    return { success: true, data: closing };
  };

  // Close ALL products for a truck + date in one action. Loops through the 3
  // product types and calls the per-product RPC, collecting results. Products
  // that are already closed/reconciled are skipped (not an error). One toast
  // is shown at the end summarising how many were closed.
  const closeDayAll = async (closingDate: string, truckId: string) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const results: DailyClosing[] = [];
    const errors: string[] = [];
    for (const productType of PRODUCT_TYPES) {
      const { data, error } = await closingRepo.closeOrReconcile({
        p_closing_date: closingDate,
        p_truck_id: truckId,
        p_product_type: productType,
        p_user_id: userId,
        p_action: "close",
      });
      if (error) {
        // "already closed" is not a hard error — collect and continue
        errors.push(`${productType}: ${error.message}`);
      } else if (data) {
        results.push(data as unknown as DailyClosing);
      }
    }
    if (results.length > 0) {
      setClosings((prev) => {
        const ids = new Set(results.map((r) => r.id));
        return [...results, ...prev.filter((c) => !ids.has(c.id))];
      });
      await db.dailyClosings.bulkPut(results as unknown as import("@/lib/db").OfflineDailyClosing[]);
    }
    if (results.length > 0 && errors.length === 0) {
      toast.success(`Hari ditutup untuk ${results.length} produk — ${new Date(closingDate).toLocaleDateString()}`);
      return { success: true, data: results };
    } else if (results.length > 0) {
      toast.success(`${results.length} produk ditutup, ${errors.length} sudah ditutup sebelum ini`);
      return { success: true, data: results };
    } else {
      toast.error("Tiada produk boleh ditutup (semua sudah ditutup/direconcile)");
      return { success: false, error: errors.join("; ") };
    }
  };

  // Reconcile ALL products for a truck + date in one action (admin only).
  const reconcileDayAll = async (closingDate: string, truckId: string) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const results: DailyClosing[] = [];
    const errors: string[] = [];
    for (const productType of PRODUCT_TYPES) {
      const { data, error } = await closingRepo.closeOrReconcile({
        p_closing_date: closingDate,
        p_truck_id: truckId,
        p_product_type: productType,
        p_user_id: userId,
        p_action: "reconcile",
      });
      if (error) {
        errors.push(`${productType}: ${error.message}`);
      } else if (data) {
        results.push(data as unknown as DailyClosing);
      }
    }
    if (results.length > 0) {
      setClosings((prev) => {
        const ids = new Set(results.map((r) => r.id));
        return [...results, ...prev.filter((c) => !ids.has(c.id))];
      });
      await db.dailyClosings.bulkPut(results as unknown as import("@/lib/db").OfflineDailyClosing[]);
    }
    if (results.length > 0) {
      toast.success(`${results.length} produk direconcile — ${new Date(closingDate).toLocaleDateString()}`);
      return { success: true, data: results };
    } else {
      toast.error("Tiada produk boleh direconcile (pastikan semua sudah ditutup)");
      return { success: false, error: errors.join("; ") };
    }
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchClosings().finally(() => setLoading(false));
  }, [fetchClosings, refreshTick]);

  return { closings, loading, closeDay, reconcileDay, closeDayAll, reconcileDayAll, refresh: fetchClosings };
};
