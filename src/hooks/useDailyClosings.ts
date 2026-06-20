import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { DailyClosing } from "@/types/pokleh";

export const useDailyClosings = () => {
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchClosings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("daily_closings")
        .select("*, area:areas(*)")
        .order("closing_date", { ascending: false });
      if (error) throw error;
      const result = (data || []) as unknown as DailyClosing[];
      setClosings(result);
      await db.dailyClosings.bulkPut(result as unknown as import("@/lib/db").OfflineDailyClosing[]);
    } catch {
      const cached = await db.dailyClosings.orderBy("closing_date").reverse().toArray();
      setClosings(cached as unknown as DailyClosing[]);
    }
  }, []);

  const closeDay = async (closingDate: string, areaId: string) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const { data, error } = await supabase.rpc("perform_daily_closing", {
      p_closing_date: closingDate,
      p_area_id: areaId,
      p_user_id: userId,
      p_action: "close",
    });
    if (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
    const closing = data as unknown as DailyClosing;
    setClosings((prev) => {
      const filtered = prev.filter((c) => c.id !== closing.id);
      return [closing, ...filtered];
    });
    await db.dailyClosings.put(closing as unknown as import("@/lib/db").OfflineDailyClosing);
    toast.success(`Day closed for ${new Date(closingDate).toLocaleDateString()}`);
    return { success: true, data: closing };
  };

  const reconcileDay = async (closingDate: string, areaId: string) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const { data, error } = await supabase.rpc("perform_daily_closing", {
      p_closing_date: closingDate,
      p_area_id: areaId,
      p_user_id: userId,
      p_action: "reconcile",
    });
    if (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
    const closing = data as unknown as DailyClosing;
    setClosings((prev) => {
      const filtered = prev.filter((c) => c.id !== closing.id);
      return [closing, ...filtered];
    });
    await db.dailyClosings.put(closing as unknown as import("@/lib/db").OfflineDailyClosing);
    toast.success(`Day reconciled for ${new Date(closingDate).toLocaleDateString()}`);
    return { success: true, data: closing };
  };

  useEffect(() => {
    fetchClosings().finally(() => setLoading(false));
  }, [fetchClosings]);

  return { closings, loading, closeDay, reconcileDay, refresh: fetchClosings };
};
