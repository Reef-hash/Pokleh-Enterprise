import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { debtLedgerRepo } from "@/repositories/debtRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { mergeUnSyncedData } from "@/lib/writeHelper";
import type { DebtLedgerEntry } from "@/types/pokleh";

export const useDebtLedger = () => {
  const [entries, setEntries] = useState<DebtLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error } = await debtLedgerRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as unknown as DebtLedgerEntry[];
      const merged = await mergeUnSyncedData("debt_ledger", result);
      setEntries(merged);
      await db.debtLedger.bulkPut(merged as unknown as import("@/lib/db").OfflineDebtLedgerEntry[]);
    } catch {
      const cached = await db.debtLedger.orderBy("created_at").reverse().toArray();
      setEntries(cached as unknown as DebtLedgerEntry[]);
    }
  }, []);

  const addEntry = async (input: {
    customer_id: string;
    entry_type: "sale" | "payment" | "adjustment";
    amount: number;
    reference_type: string;
    reference_id: string;
    balance_before: number;
    balance_after: number;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const { data, error } = await debtLedgerRepo.create({ ...input, created_by: userId });
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    const entry = data as unknown as DebtLedgerEntry;
    setEntries((prev) => [entry, ...prev]);
    await db.debtLedger.put(entry as unknown as import("@/lib/db").OfflineDebtLedgerEntry);
    return { success: true, data: entry };
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchEntries().finally(() => setLoading(false));
  }, [fetchEntries, refreshTick]);

  return { entries, loading, addEntry, refresh: fetchEntries };
};
