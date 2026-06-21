import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { persistWrite } from "@/lib/writeHelper";
import type { StockIntake } from "@/types/pokleh";

export const useStockIntake = () => {
  const [intakes, setIntakes] = useState<StockIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchIntakes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("stock_intake")
        .select("*, supplier:suppliers(*)")
        .order("intake_date", { ascending: false });
      if (error) throw error;
      const result = (data || []) as unknown as StockIntake[];
      setIntakes(result);
      await db.stockIntakes.bulkPut(result as unknown as import("@/lib/db").OfflineStockIntake[]);
    } catch {
      const cached = await db.stockIntakes.orderBy("intake_date").reverse().toArray();
      if (cached.length > 0) setIntakes(cached as unknown as StockIntake[]);
    }
  }, []);

  const addIntake = async (data: {
    intake_date: string;
    supplier_id: string;
    quantity_received: number;
    cost_per_pax: number;
    notes?: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    return persistWrite<StockIntake>({
      entity: "stock_intake",
      action: "INSERT",
      userId,
      data: { ...data, created_by: userId },
      execute: () =>
        supabase
          .from("stock_intake")
          .insert({ ...data, created_by: userId })
          .select("*, supplier:suppliers(*)")
          .single(),
      onSuccess: (intake) => setIntakes((prev) => [intake, ...prev]),
      dexiePut: (intake) =>
        db.stockIntakes.put(intake as unknown as import("@/lib/db").OfflineStockIntake),
      msg: "Stock intake recorded",
    });
  };

  useEffect(() => {
    fetchIntakes().finally(() => setLoading(false));
  }, [fetchIntakes]);

  return { intakes, loading, addIntake, refresh: fetchIntakes };
};
