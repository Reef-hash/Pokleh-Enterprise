import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { debtCollectionRepo, debtLedgerRepo } from "@/repositories/debtRepo";
import { customersRepo } from "@/repositories/customersRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { persistWrite } from "@/lib/writeHelper";
import type { DebtCollection } from "@/types/pokleh";

export const useDebtCollection = () => {
  const [collections, setCollections] = useState<DebtCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchCollections = useCallback(async () => {
    try {
      const { data, error } = await debtCollectionRepo.fetchAll();
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

    let collectionResult: DebtCollection | null = null;

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
        collectionResult = collection;
        setCollections((prev) =>
          prev.map((c) => (c.id === tempId ? collection : c))
        );
      },
      dexiePut: (collection) =>
        db.debtCollections.put(collection as unknown as import("@/lib/db").OfflineDebtCollection),
      cacheOffline: async () => db.debtCollections.put(optimistic as unknown as import("@/lib/db").OfflineDebtCollection),
      msg: "Debt collection recorded",
    });

    if (result.success && collectionResult) {
      const { data: cust } = await customersRepo.fetchBalance(input.customer_id);
      const balanceBefore = (cust as { debt_balance: number } | null)?.debt_balance ?? 0;
      const balanceAfter = balanceBefore - input.amount;

      const { error: ledError } = await debtLedgerRepo.create({
        customer_id: input.customer_id,
        entry_type: "payment",
        amount: input.amount,
        reference_type: "debt_collection",
        reference_id: collectionResult.id,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        created_by: userId,
      });
      if (ledError) {
        toast.error("Collection recorded but debt ledger update failed");
      }
    }

    return result;
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchCollections().finally(() => setLoading(false));
  }, [fetchCollections, refreshTick]);

  return { collections, loading, addCollection, refresh: fetchCollections };
};
