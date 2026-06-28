import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { supabase } from "@/integrations/supabase/client";
import { settlementRepo, settlementRpc } from "@/repositories/settlementRepo";
import { stockIntakeRepo, stockDistributionRepo } from "@/repositories/stockRepo";
import { offlineDetector } from "@/services/offline";
import { syncEngine } from "@/services/sync";
import { mergeUnSyncedData } from "@/lib/writeHelper";
import { toast } from "sonner";
import type { SupplierSettlement } from "@/types/pokleh";
import { useAuthStore } from "@/stores/authStore";
import { getUserFriendlyError } from "@/lib/errors";

export const useSettlements = () => {
  const [settlements, setSettlements] = useState<SupplierSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);

  const fetchSettlements = useCallback(async () => {
    try {
      const { data, error } = await settlementRepo.fetchAll();
      if (error) throw error;
      const merged = await mergeUnSyncedData("supplier_settlements", (data || []) as unknown as SupplierSettlement[]);
      setSettlements(merged);
    } catch {
      // offline fallback
    }
  }, []);

  const calculateSettlement = async (intakeId: string) => {
    try {
      const intake = settlements.find((s) => s.intake_id === intakeId)?.intake;
      if (!intake) {
        const { data } = await stockIntakeRepo.fetchById(intakeId);
        if (!data) {
          toast.error("Intake not found");
          return { success: false };
        }
      }

      const { data: soldData, error: soldError } = await settlementRpc.getTotalSold(intakeId);
      if (soldError) {
        toast.error("Failed to calculate sold quantity");
        return { success: false };
      }

      const totalSold = (soldData as number) || 0;
      const { data: distData } = await supabase
        .from("stock_distribution")
        .select("quantity_assigned")
        .eq("intake_id", intakeId);
      const totalAssigned = ((distData || []) as { quantity_assigned: number }[]).reduce(
        (sum, d) => sum + d.quantity_assigned, 0
      );

      const { data: returnData } = await settlementRpc.getTotalReturned(intakeId);
      const totalReturned = (returnData as number) || 0;
      const costPerPax = (await stockIntakeRepo.fetchById(intakeId)).data as { cost_per_pax: number; quantity_received: number } | null;

      if (!costPerPax) {
        toast.error("Intake not found");
        return { success: false };
      }

      const payableQty = totalSold;
      const payableAmount = payableQty * costPerPax.cost_per_pax;

      const { data: existing } = await settlementRepo.fetchExisting(intakeId);

      let result;
      if (existing) {
        const { data: updateData, error: updateError } = await supabase
          .from("supplier_settlements")
          .update({
            total_received: costPerPax.quantity_received,
            total_sold: totalSold,
            total_returned: totalReturned,
            payable_quantity: payableQty,
            cost_per_pax: costPerPax.cost_per_pax,
            payable_amount: payableAmount,
          })
          .eq("id", existing.id)
          .select("*, intake:stock_intake(*, supplier:suppliers(*))")
          .single();
        if (updateError) {
          toast.error(getUserFriendlyError(updateError, "supplier_settlements"));
          return { success: false };
        }
        result = updateData;
      } else {
        const { data: insertData, error: insertError } = await settlementRepo.upsert({
          intake_id: intakeId,
          total_received: costPerPax.quantity_received,
          total_sold: totalSold,
          total_returned: totalReturned,
          payable_quantity: payableQty,
          cost_per_pax: costPerPax.cost_per_pax,
          payable_amount: payableAmount,
        });
        if (insertError) {
          toast.error(getUserFriendlyError(insertError, "supplier_settlements"));
          return { success: false };
        }
        result = insertData;
      }

      setSettlements((prev) => {
        const filtered = prev.filter((s) => s.id !== (result as SupplierSettlement).id);
        return [result as unknown as SupplierSettlement, ...filtered];
      });
      toast.success("Settlement calculated");
      await triggerRefresh();
      return { success: true, data: result as unknown as SupplierSettlement };
    } catch (err: any) {
      toast.error("Connection error. Please try again.");
      return { success: false };
    }
  };

  const markSettled = async (id: string) => {
    if (!userId) return { success: false };

    if (!offlineDetector.isOnline) {
      await syncEngine.enqueue({
        entity: "supplier_settlements",
        entityId: id,
        action: "UPDATE",
        payload: { status: "settled", settlement_date: new Date().toISOString().split("T")[0], settled_by: userId },
      });
      toast.success("Settlement queued for sync");
      return { success: true, offline: true };
    }

    try {
      const { error } = await settlementRepo.markSettled(id, {
        status: "settled",
        settlement_date: new Date().toISOString().split("T")[0],
        settled_by: userId,
      });
      if (error) {
        toast.error(getUserFriendlyError(error, "supplier_settlements"));
        return { success: false };
      }
      setSettlements((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: "settled" as const, settlement_date: new Date().toISOString().split("T")[0] }
            : s
        )
      );
      toast.success("Settlement marked as settled");
      await triggerRefresh();
      return { success: true };
    } catch (err: any) {
      toast.error("Connection error. Please try again.");
      return { success: false };
    }
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchSettlements().finally(() => setLoading(false));
  }, [fetchSettlements, refreshTick, triggerRefresh]);

  return { settlements, loading, calculateSettlement, markSettled, refresh: fetchSettlements };
};
