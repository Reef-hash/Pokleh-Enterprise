import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { toast } from "sonner";
import type { SupplierPriceHistory } from "@/types/pokleh";

export const useSupplierPriceHistory = () => {
  const [history, setHistory] = useState<SupplierPriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("supplier_price_history")
        .select("*")
        .order("effective_date", { ascending: false });
      if (error) throw error;
      const result = (data || []) as unknown as SupplierPriceHistory[];
      setHistory(result);
      await db.supplierPriceHistory.bulkPut(result as unknown as import("@/lib/db").OfflineSupplierPriceHistory[]);
    } catch {
      const cached = await db.supplierPriceHistory.orderBy("effective_date").reverse().toArray();
      setHistory(cached as unknown as SupplierPriceHistory[]);
    }
  }, []);

  useEffect(() => {
    fetchHistory().finally(() => setLoading(false));
  }, [fetchHistory]);

  return { history, loading, refresh: fetchHistory };
};
