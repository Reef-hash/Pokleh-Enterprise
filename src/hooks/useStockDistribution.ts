import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
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
      setDistributions((data || []) as unknown as StockDistribution[]);
    } catch {
      console.warn("Failed to fetch distributions");
    }
  }, [intakeId]);

  const addDistribution = async (data: {
    intake_id: string;
    area_id: string;
    quantity_assigned: number;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };

    const { data: result, error } = await supabase
      .from("stock_distribution")
      .insert({ ...data, created_by: userId })
      .select("*, intake:stock_intake(*), area:areas(*)")
      .single();
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    const dist = result as unknown as StockDistribution;
    setDistributions((prev) => [dist, ...prev]);
    toast.success("Stock distributed");
    return { success: true, data: dist };
  };

  useEffect(() => {
    fetchDistributions().finally(() => setLoading(false));
  }, [fetchDistributions]);

  return { distributions, loading, addDistribution, refresh: fetchDistributions };
};
