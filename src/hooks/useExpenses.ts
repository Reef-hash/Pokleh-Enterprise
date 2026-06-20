import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { Expense } from "@/types/pokleh";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchExpenses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      const result = (data || []) as unknown as Expense[];
      setExpenses(result);
      await db.expenses.bulkPut(result as unknown as import("@/lib/db").OfflineExpense[]);
    } catch {
      const cached = await db.expenses.orderBy("expense_date").reverse().toArray();
      setExpenses(cached as unknown as Expense[]);
    }
  }, []);

  const addExpense = async (input: {
    category: string;
    amount: number;
    expense_date: string;
    notes?: string;
  }) => {
    if (!userId) return { success: false, error: "Not authenticated" };
    const { data, error } = await supabase
      .from("expenses")
      .insert({ ...input, created_by: userId })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      return { success: false };
    }
    const expense = data as unknown as Expense;
    setExpenses((prev) => [expense, ...prev]);
    await db.expenses.put(expense as unknown as import("@/lib/db").OfflineExpense);
    toast.success("Expense recorded");
    return { success: true, data: expense };
  };

  useEffect(() => {
    fetchExpenses().finally(() => setLoading(false));
  }, [fetchExpenses]);

  return { expenses, loading, addExpense, refresh: fetchExpenses };
};
