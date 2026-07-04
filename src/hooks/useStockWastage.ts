import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { wastageRepo, wastageAdjustmentRepo } from "@/repositories/wastageRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { offlineDetector } from "@/services/offline";
import { syncEngine } from "@/services/sync";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/errors";
import type { StockWastage, WastageAdjustment } from "@/types/pokleh";

export const useStockWastage = () => {
  const [wastages, setWastages] = useState<StockWastage[]>([]);
  const [adjustments, setAdjustments] = useState<WastageAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);
  // Wastage mutates truck available stock (get_truck_available_stock now
  // subtracts SUM(quantity_wasted)), so re-fetch truck stock views after any
  // wastage write so the UI reflects the reduced balance immediately.
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);

  const fetchWastages = useCallback(async () => {
    // Show cached data immediately (if this page has been opened online
    // before) so it never blocks on the network; refresh silently
    // underneath and keep the cache showing if that refresh fails.
    const cached = await db.stockWastages?.toArray();
    if (cached?.length) {
      setWastages(cached as unknown as StockWastage[]);
      setLoading(false);
    }

    try {
      const { data, error } = await wastageRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as StockWastage[];
      setWastages(result);
      if (result.length > 0) await db.stockWastages?.bulkPut(result as unknown as import("@/lib/db").OfflineStockWastage[]);
    } catch {
      // Network failed — cached data (if any) is already shown above.
    }
  }, []);

  const fetchAdjustments = useCallback(async () => {
    // Show cached data immediately (if this page has been opened online
    // before) so it never blocks on the network; refresh silently
    // underneath and keep the cache showing if that refresh fails.
    const cached = await db.wastageAdjustments?.toArray();
    if (cached?.length) {
      setAdjustments(cached as unknown as WastageAdjustment[]);
      setLoading(false);
    }

    try {
      const { data, error } = await wastageAdjustmentRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as WastageAdjustment[];
      setAdjustments(result);
      if (result.length > 0) await db.wastageAdjustments?.bulkPut(result as unknown as import("@/lib/db").OfflineWastageAdjustment[]);
    } catch {
      // Network failed — cached data (if any) is already shown above.
    }
  }, []);

  const addWastage = async (data: {
    truck_id: string;
    product_type: string;
    quantity_wasted: number;
    waste_date: string;
    intake_id?: string;
    notes?: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    const now = new Date().toISOString();
    const record = {
      truck_id: data.truck_id,
      product_type: data.product_type,
      quantity_wasted: data.quantity_wasted,
      waste_date: data.waste_date,
      intake_id: data.intake_id ?? null,
      notes: data.notes ?? null,
      created_by: userId,
    };

    const optimistic: StockWastage = {
      ...record,
      id: crypto.randomUUID(),
      created_at: now,
    } as StockWastage;

    if (!offlineDetector.isOnline) {
      await syncEngine.enqueue({
        entity: "stock_wastage",
        entityId: optimistic.id,
        action: "INSERT",
        payload: record as Record<string, unknown>,
      });
      setWastages((prev) => [optimistic, ...prev]);
      await db.stockWastages?.put(optimistic as any);
      triggerRefresh();
      toast.success("Wastage recorded offline — will sync when connected");
      return { success: true, offline: true };
    }

    setWastages((prev) => [optimistic, ...prev]);
    const { data: created, error } = await wastageRepo.create(record);
    if (error) {
      toast.error(getUserFriendlyError(error, "stock_wastage"));
      setWastages((prev) => prev.filter((w) => w.id !== optimistic.id));
      return { success: false };
    }
    const result = (created || {}) as unknown as StockWastage;
    setWastages((prev) => [...prev.filter((w) => w.id !== optimistic.id), result]);
    await db.stockWastages?.put(result as any);
    triggerRefresh();
    toast.success("Wastage recorded");
    return { success: true, data: result };
  };

  const addAdjustment = async (data: {
    intake_id: string;
    truck_id: string;
    product_type: string;
    total_wasted: number;
    reduction_quantity: number;
    reason?: string;
    adjustment_date: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    const record = {
      intake_id: data.intake_id,
      truck_id: data.truck_id,
      product_type: data.product_type,
      total_wasted: data.total_wasted,
      reduction_quantity: data.reduction_quantity,
      reason: data.reason ?? null,
      adjustment_date: data.adjustment_date,
      created_by: userId,
    };

    const now = new Date().toISOString();
    const optimistic: WastageAdjustment = {
      ...record,
      id: crypto.randomUUID(),
      approved_by: null,
      approved_at: null,
      created_at: now,
    } as WastageAdjustment;

    if (!offlineDetector.isOnline) {
      await syncEngine.enqueue({
        entity: "wastage_adjustments",
        entityId: optimistic.id,
        action: "INSERT",
        payload: record as Record<string, unknown>,
      });
      setAdjustments((prev) => [optimistic, ...prev]);
      await db.wastageAdjustments?.put(optimistic as any);
      triggerRefresh();
      toast.success("Adjustment recorded offline — will sync when connected");
      return { success: true, offline: true };
    }

    setAdjustments((prev) => [optimistic, ...prev]);
    const { data: created, error } = await wastageAdjustmentRepo.create(record);
    if (error) {
      toast.error(getUserFriendlyError(error, "wastage_adjustments"));
      setAdjustments((prev) => prev.filter((a) => a.id !== optimistic.id));
      return { success: false };
    }
    const result = (created || {}) as unknown as WastageAdjustment;
    setAdjustments((prev) => [...prev.filter((a) => a.id !== optimistic.id), result]);
    await db.wastageAdjustments?.put(result as any);
    triggerRefresh();
    toast.success("Adjustment recorded");
    return { success: true, data: result };
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    Promise.all([fetchWastages(), fetchAdjustments()]).finally(() => setLoading(false));
  }, [fetchWastages, fetchAdjustments, refreshTick]);

  return {
    wastages,
    adjustments,
    loading,
    addWastage,
    addAdjustment,
    refresh: () => Promise.all([fetchWastages(), fetchAdjustments()]),
  };
};
