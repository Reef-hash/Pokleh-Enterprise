import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { offlineDetector } from "@/services/offline";
import { syncEngine } from "@/services/sync";
import { toast } from "sonner";
import type { SupplierSettlement } from "@/types/pokleh";
import { useAuthStore } from "@/stores/authStore";

export const useSettlements = () => {
  const [settlements, setSettlements] = useState<SupplierSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchSettlements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("supplier_settlements")
        .select("*, intake:stock_intake(*, supplier:suppliers(*))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSettlements((data || []) as unknown as SupplierSettlement[]);
    } catch {
      // offline fallback
    }
  }, []);

  const calculateSettlement = async (intakeId: string) => {
    const intake = settlements.find((s) => s.intake_id === intakeId)?.intake;
    if (!intake) {
      const { data } = await supabase
        .from("stock_intake")
        .select("*, supplier:suppliers(*)")
        .eq("id", intakeId)
        .single();
      if (!data) {
        toast.error("Intake not found");
        return { success: false };
      }
    }

    const { data: soldData, error: soldError } = await supabase
      .rpc("get_total_sold_for_intake", { p_intake_id: intakeId });
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

    const { data: returnData } = await supabase
      .rpc("get_total_returned_for_intake", { p_intake_id: intakeId });
    const totalReturned = (returnData as number) || 0;
    const costPerPax = (await supabase
      .from("stock_intake")
      .select("cost_per_pax, quantity_received")
      .eq("id", intakeId)
      .single()).data as { cost_per_pax: number; quantity_received: number } | null;

    if (!costPerPax) {
      toast.error("Intake not found");
      return { success: false };
    }

    const payableQty = totalSold;
    const payableAmount = payableQty * costPerPax.cost_per_pax;

    const { data: existing } = await supabase
      .from("supplier_settlements")
      .select("id")
      .eq("intake_id", intakeId)
      .maybeSingle();

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
        toast.error(updateError.message);
        return { success: false };
      }
      result = updateData;
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from("supplier_settlements")
        .insert({
          intake_id: intakeId,
          total_received: costPerPax.quantity_received,
          total_sold: totalSold,
          total_returned: totalReturned,
          payable_quantity: payableQty,
          cost_per_pax: costPerPax.cost_per_pax,
          payable_amount: payableAmount,
        })
        .select("*, intake:stock_intake(*, supplier:suppliers(*))")
        .single();
      if (insertError) {
        toast.error(insertError.message);
        return { success: false };
      }
      result = insertData;
    }

    setSettlements((prev) => {
      const filtered = prev.filter((s) => s.id !== (result as SupplierSettlement).id);
      return [result as unknown as SupplierSettlement, ...filtered];
    });
    toast.success("Settlement calculated");
    return { success: true, data: result as unknown as SupplierSettlement };
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

    const { error } = await supabase
      .from("supplier_settlements")
      .update({ status: "settled", settlement_date: new Date().toISOString().split("T")[0], settled_by: userId })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
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
    return { success: true };
  };

  useEffect(() => {
    fetchSettlements().finally(() => setLoading(false));
  }, [fetchSettlements]);

  return { settlements, loading, calculateSettlement, markSettled, refresh: fetchSettlements };
};
