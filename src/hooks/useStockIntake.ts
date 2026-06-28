import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { stockIntakeRepo } from "@/repositories/stockRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { offlineDetector } from "@/services/offline";
import { syncEngine } from "@/services/sync";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/errors";
import { mergeUnSyncedData } from "@/lib/writeHelper";
import type { StockIntake, ProductType } from "@/types/pokleh";

export const useStockIntake = () => {
  const [intakes, setIntakes] = useState<StockIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchIntakes = useCallback(async () => {
    try {
      const { data, error } = await stockIntakeRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as StockIntake[];
      const merged = await mergeUnSyncedData("stock_intake", result);
      setIntakes(merged);
      await db.stockIntakes.bulkPut(merged as unknown as import("@/lib/db").OfflineStockIntake[]);
    } catch {
      const cached = await db.stockIntakes.orderBy("intake_date").reverse().toArray();
      if (cached.length > 0) setIntakes(cached as unknown as StockIntake[]);
    }
  }, []);

  /** One trip can collect several product types at once; each becomes its own stock_intake row sharing truck/supplier/date. */
  const addIntake = async (data: {
    intake_date: string;
    supplier_id: string;
    truck_id: string;
    lines: { product_type: ProductType; quantity_received: number; cost_per_pax: number }[];
    notes?: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    if (data.lines.length === 0) return { success: false, error: "No product lines" };

    const now = new Date().toISOString();
    const rows = data.lines.map((line) => ({
      intake_date: data.intake_date,
      supplier_id: data.supplier_id,
      truck_id: data.truck_id,
      product_type: line.product_type,
      quantity_received: line.quantity_received,
      cost_per_pax: line.cost_per_pax,
      notes: data.notes ?? null,
      created_by: userId,
    }));
    const optimistic: StockIntake[] = rows.map((row) => ({
      ...row,
      id: crypto.randomUUID(),
      created_at: now,
    }) as StockIntake);

    if (!offlineDetector.isOnline) {
      for (let i = 0; i < rows.length; i++) {
        await syncEngine.enqueue({ entity: "stock_intake", entityId: optimistic[i].id, action: "INSERT", payload: rows[i] as Record<string, unknown> });
      }
      setIntakes((prev) => [...optimistic, ...prev]);
      await db.stockIntakes.bulkPut(optimistic as unknown as import("@/lib/db").OfflineStockIntake[]);
      toast.success("Saved offline — will sync when connected");
      return { success: true, offline: true };
    }

    setIntakes((prev) => [...optimistic, ...prev]);
    const { data: created, error } = await stockIntakeRepo.createMany(rows);
    if (error) {
      toast.error(getUserFriendlyError(error, "stock_intake"));
      setIntakes((prev) => prev.filter((i) => !optimistic.some((o) => o.id === i.id)));
      return { success: false };
    }
    const result = (created || []) as unknown as StockIntake[];
    setIntakes((prev) => [...result, ...prev.filter((i) => !optimistic.some((o) => o.id === i.id))]);
    await db.stockIntakes.bulkPut(result as unknown as import("@/lib/db").OfflineStockIntake[]);
    toast.success("Stock intake recorded");
    return { success: true, data: result };
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchIntakes().finally(() => setLoading(false));
  }, [fetchIntakes, refreshTick]);

  return { intakes, loading, addIntake, refresh: fetchIntakes };
};
