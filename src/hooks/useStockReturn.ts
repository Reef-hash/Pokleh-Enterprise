import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { offlineDetector } from "@/services/offline";
import { syncEngine } from "@/services/sync";
import { toast } from "sonner";
import type { StockReturn } from "@/types/pokleh";

export const useStockReturn = (areaId?: string) => {
  const [returns, setReturns] = useState<StockReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchReturns = useCallback(async () => {
    try {
      let query = supabase
        .from("stock_return")
        .select("*, distribution:stock_distribution(*, area:areas(*)), area:areas(*)")
        .order("return_date", { ascending: false });
      if (areaId) query = query.eq("area_id", areaId);
      const { data, error } = await query;
      if (error) throw error;
      const result = (data || []) as unknown as StockReturn[];
      setReturns(result);
      await db.stockReturns.bulkPut(result as unknown as import("@/lib/db").OfflineStockReturn[]);
    } catch {
      const cached = await db.stockReturns.orderBy("return_date").reverse().toArray();
      if (cached.length > 0) setReturns(cached as unknown as StockReturn[]);
    }
  }, [areaId]);

  const addReturn = async (data: {
    distribution_id: string;
    area_id: string;
    quantity_returned: number;
    return_date: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    if (!offlineDetector.isOnline) {
      const tempId = crypto.randomUUID();
      const offlineData = { ...data, created_by: userId } as Record<string, unknown>;
      await syncEngine.enqueue({ entity: "stock_return", entityId: tempId, action: "INSERT", payload: offlineData });
      toast.success("Return queued for sync");
      return { success: true, offline: true };
    }

    const { data: result, error } = await supabase
      .from("stock_return")
      .insert({ ...data, created_by: userId })
      .select("*, distribution:stock_distribution(*, area:areas(*)), area:areas(*)")
      .single();
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    const ret = result as unknown as StockReturn;
    setReturns((prev) => [ret, ...prev]);
    await db.stockReturns.put(ret as unknown as import("@/lib/db").OfflineStockReturn);
    toast.success("Stock return recorded");
    return { success: true, data: ret };
  };

  useEffect(() => {
    fetchReturns().finally(() => setLoading(false));
  }, [fetchReturns]);

  return { returns, loading, addReturn, refresh: fetchReturns };
};
