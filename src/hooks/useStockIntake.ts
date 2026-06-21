import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { offlineDetector } from "@/services/offline";
import { syncEngine } from "@/services/sync";
import { toast } from "sonner";
import type { StockIntake } from "@/types/pokleh";
import { getUserFriendlyError } from "@/lib/errors";

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

    if (!offlineDetector.isOnline) {
      const tempId = crypto.randomUUID();
      const offlineData = { ...data, created_by: userId } as Record<string, unknown>;
      await syncEngine.enqueue({ entity: "stock_intake", entityId: tempId, action: "INSERT", payload: offlineData });
      toast.success("Stock intake queued for sync");
      return { success: true, offline: true };
    }

    const { data: result, error } = await supabase
      .from("stock_intake")
      .insert({ ...data, created_by: userId })
      .select("*, supplier:suppliers(*)")
      .single();
    if (error) {
      toast.error(getUserFriendlyError(error, "stock_intake"));
      return { success: false };
    }
    const intake = result as unknown as StockIntake;
    setIntakes((prev) => [intake, ...prev]);
    await db.stockIntakes.put(intake as unknown as import("@/lib/db").OfflineStockIntake);
    toast.success("Stock intake recorded");
    return { success: true, data: intake };
  };

  useEffect(() => {
    fetchIntakes().finally(() => setLoading(false));
  }, [fetchIntakes]);

  return { intakes, loading, addIntake, refresh: fetchIntakes };
};
