import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { Sale } from "@/types/pokleh";

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchSales = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*, customer:customers(*), area:areas(*), staff:profiles!sales_staff_id_fkey(*)")
        .order("sale_date", { ascending: false });
      if (error) throw error;
      const result = (data || []) as unknown as Sale[];
      setSales(result);
      await db.sales.bulkPut(result as unknown as import("@/lib/db").OfflineSale[]);
    } catch {
      const cached = await db.sales.orderBy("sale_date").reverse().toArray();
      setSales(cached as unknown as Sale[]);
    }
  }, []);

  const addSale = async (input: {
    customer_id: string;
    area_id: string;
    quantity: number;
    selling_price: number;
    payment_type: "cash" | "debt";
    distribution_id?: string;
    sale_date: string;
    notes?: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const { data, error } = await supabase
      .from("sales")
      .insert({ ...input, staff_id: userId })
      .select("*, customer:customers(*), area:areas(*), staff:profiles!sales_staff_id_fkey(*)")
      .single();
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    const sale = data as unknown as Sale;
    setSales((prev) => [sale, ...prev]);
    await db.sales.put(sale as unknown as import("@/lib/db").OfflineSale);
    toast.success("Sale recorded");
    return { success: true, data: sale };
  };

  useEffect(() => {
    fetchSales().finally(() => setLoading(false));
  }, [fetchSales]);

  return { sales, loading, addSale, refresh: fetchSales };
};
