import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { salesRepo } from "@/repositories/salesRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { Sale, ProductType } from "@/types/pokleh";
import { persistWrite, mergeUnSyncedData } from "@/lib/writeHelper";

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);

  const fetchSales = useCallback(async () => {
    try {
      const { data, error } = await salesRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as Sale[];

      // Merge with unsynced local data to prevent data loss during sync
      const merged = await mergeUnSyncedData("sales", result);
      setSales(merged);
      await db.sales.bulkPut(merged as unknown as import("@/lib/db").OfflineSale[]);
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
      onSuccess: (sale: Sale) => {
        setSales((prev) => prev.map((s) => (s.id === tempId ? sale : s)));
        // Debt sales mutate customers.debt_balance via a DB trigger
        // (sync_sale_to_debt_ledger), so re-fetch customers to reflect the
        // updated cached balance. Cash sales need no refresh.
        if (input.payment_type === "debt") {
          triggerRefresh();
        }
      },
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
