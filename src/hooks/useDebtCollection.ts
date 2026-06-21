import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { DebtCollection } from "@/types/pokleh";

export const useDebtCollection = () => {
  const [collections, setCollections] = useState<DebtCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchCollections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("debt_collection")
        .select("*, customer:customers(*), staff:profiles!debt_collection_staff_id_fkey(*)")
        .order("collection_date", { ascending: false });
      if (error) throw error;
      const result = (data || []) as unknown as DebtCollection[];
      setCollections(result);
      await db.debtCollections.bulkPut(result as unknown as import("@/lib/db").OfflineDebtCollection[]);
    } catch {
      const cached = await db.debtCollections.orderBy("collection_date").reverse().toArray();
      setCollections(cached as unknown as DebtCollection[]);
    }
  }, []);

  const addCollection = async (input: {
    customer_id: string;
    amount: number;
    collection_date: string;
    notes?: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const { data: colData, error: colError } = await supabase
      .from("debt_collection")
      .insert({ ...input, staff_id: userId })
      .select("*, customer:customers(*), staff:profiles!debt_collection_staff_id_fkey(*)")
      .single();
    if (colError) {
      toast.error(colError.message);
      return { success: false };
    }
    const collection = colData as unknown as DebtCollection;

    const { data: cust } = await supabase
      .from("customers")
      .select("debt_balance")
      .eq("id", input.customer_id)
      .single();
    const balanceBefore = (cust as { debt_balance: number } | null)?.debt_balance ?? 0;
    const balanceAfter = balanceBefore - input.amount;

    const { error: ledError } = await supabase.from("debt_ledger").insert({
      customer_id: input.customer_id,
      entry_type: "payment",
      amount: input.amount,
      reference_type: "debt_collection",
      reference_id: collection.id,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      created_by: userId,
    });
    if (ledError) {
      toast.error("Collection recorded but debt ledger update failed");
    }

    setCollections((prev) => [collection, ...prev]);
    await db.debtCollections.put(collection as unknown as import("@/lib/db").OfflineDebtCollection);
    toast.success("Debt collection recorded");
    return { success: true, data: collection };
  };

  useEffect(() => {
    fetchCollections().finally(() => setLoading(false));
  }, [fetchCollections]);

  return { collections, loading, addCollection, refresh: fetchCollections };
};
