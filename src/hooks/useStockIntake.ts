import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
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
      setIntakes((data || []) as unknown as StockIntake[]);
    } catch {
      // offline fallback
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
    const { data: result, error } = await supabase
      .from("stock_intake")
      .insert({ ...data, created_by: userId })
      .select("*, supplier:suppliers(*)")
      .single();
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    const intake = result as unknown as StockIntake;
    setIntakes((prev) => [intake, ...prev]);
    toast.success("Stock intake recorded");
    return { success: true, data: intake };
  };

  useEffect(() => {
    fetchIntakes().finally(() => setLoading(false));
  }, [fetchIntakes]);

  return { intakes, loading, addIntake, refresh: fetchIntakes };
};
