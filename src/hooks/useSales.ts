import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { salesRepo } from "@/repositories/salesRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { Sale, ProductType } from "@/types/pokleh";
import { persistWrite } from "@/lib/writeHelper";

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchSales = useCallback(async () => {
    try {
      const { data, error } = await salesRepo.fetchAll();
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
    truck_id: string;
    product_type: ProductType;
    quantity: number;
    selling_price: number;
    payment_type: "cash" | "debt";
    distribution_id?: string;
    sale_date: string;
    notes?: string;
  }) => {
    const tempId = crypto.randomUUID();
    const optimistic: Sale = {
      id: tempId, customer_id: input.customer_id, truck_id: input.truck_id,
      product_type: input.product_type,
      quantity: input.quantity, selling_price: input.selling_price,
      payment_type: input.payment_type, distribution_id: input.distribution_id ?? null,
      staff_id: userId!, sale_date: input.sale_date, notes: input.notes ?? null,
      correction_of: null, correction_status: null, created_at: new Date().toISOString(),
      customer: {} as any, truck: {} as any, staff: {} as any,
    };

    return persistWrite({
      entity: "sales",
      action: "INSERT",
      userId,
      data: { ...input, staff_id: userId },
      execute: () => salesRepo.create({ ...input, staff_id: userId! }),
      optimistic: {
        add: () => setSales((prev) => [optimistic, ...prev]),
        remove: () => setSales((prev) => prev.filter((s) => s.id !== tempId)),
      },
      onSuccess: (sale: Sale) => setSales((prev) => prev.map((s) => (s.id === tempId ? sale : s))),
      dexiePut: (sale: Sale) => db.sales.put(sale as unknown as import("@/lib/db").OfflineSale),
      cacheOffline: async () => db.sales.put(optimistic as unknown as import("@/lib/db").OfflineSale),
      msg: "Sale recorded",
    });
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchSales().finally(() => setLoading(false));
  }, [fetchSales, refreshTick]);

  return { sales, loading, addSale, refresh: fetchSales };
};
