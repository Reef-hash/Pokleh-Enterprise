import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      let query = supabase
        .from("stock_distribution")
        .select("*, intake:stock_intake(*), area:areas(*)");
      if (intakeId) query = query.eq("intake_id", intakeId);
      const { data, error } = await query.order("created_at", { ascending: false });
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

    return persistWrite<StockDistribution>({
      entity: "stock_distribution",
      action: "INSERT",
      userId,
      data: { ...data, created_by: userId },
      execute: () =>
        supabase
          .from("stock_distribution")
          .insert({ ...data, created_by: userId })
          .select("*, intake:stock_intake(*), area:areas(*)")
          .single(),
      onSuccess: (dist) => setDistributions((prev) => [dist, ...prev]),
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
