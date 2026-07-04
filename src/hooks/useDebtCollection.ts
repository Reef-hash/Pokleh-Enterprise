import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { debtCollectionRepo } from "@/repositories/debtRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { persistWrite, mergeUnSyncedData } from "@/lib/writeHelper";
import type { DebtCollection } from "@/types/pokleh";

export const useDebtCollection = () => {
  const [collections, setCollections] = useState<DebtCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);

  const fetchCollections = useCallback(async () => {
    try {
      const { data, error } = await debtCollectionRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as DebtCollection[];
      const merged = await mergeUnSyncedData("debt_collection", result);
      setCollections(merged);
      await db.debtCollections.bulkPut(merged as unknown as import("@/lib/db").OfflineDebtCollection[]);
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

    const tempId = crypto.randomUUID();
    const optimistic: DebtCollection = {
      id: tempId,
      customer_id: input.customer_id,
      amount: input.amount,
      collection_date: input.collection_date,
      notes: input.notes ?? null,
      staff_id: userId,
      correction_of: null,
      correction_status: null,
      created_at: new Date().toISOString(),
    };

    const result = await persistWrite<DebtCollection>({
      entity: "debt_collection",
      action: "INSERT",
      userId,
      data: { ...input, staff_id: userId },
      execute: () => debtCollectionRepo.create({ ...input, staff_id: userId }),
      optimistic: {
        add: () => setCollections((prev) => [optimistic, ...prev]),
        remove: () => setCollections((prev) => prev.filter((c) => c.id !== tempId)),
      },
      onSuccess: (collection) => {
        setCollections((prev) =>
          prev.map((c) => (c.id === tempId ? collection : c))
        );
        // The debt_collection insert mutates customers.debt_balance via a DB
        // trigger (sync_debt_collection_to_ledger -> maintain_debt_balance),
        // so re-fetch customers to reflect the updated cached balance —
        // mirrors useSales.addSale for debt sales.
        triggerRefresh();
      },
      dexiePut: (collection) =>
        db.debtCollections.put(collection as unknown as import("@/lib/db").OfflineDebtCollection),
      cacheOffline: async () => db.debtCollections.put(optimistic as unknown as import("@/lib/db").OfflineDebtCollection),
      msg: "Debt collection recorded",
    });

    return result;
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchCollections().finally(() => setLoading(false));
  }, [fetchCollections, refreshTick]);

  return { collections, loading, addCollection, refresh: fetchCollections };
};
