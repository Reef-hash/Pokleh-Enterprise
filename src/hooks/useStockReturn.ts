import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
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
      setReturns((data || []) as unknown as StockReturn[]);
    } catch {
      console.warn("Failed to fetch stock returns");
    }
  }, [areaId]);

  const addReturn = async (data: {
    distribution_id: string;
    area_id: string;
    quantity_returned: number;
    return_date: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };
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
    toast.success("Stock return recorded");
    return { success: true, data: ret };
  };

  useEffect(() => {
    fetchReturns().finally(() => setLoading(false));
  }, [fetchReturns]);

  return { returns, loading, addReturn, refresh: fetchReturns };
};
