import { useState, useEffect, useCallback } from "react";
import { expensesRepo } from "@/repositories/expensesRepo";
import { db } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import { persistWrite } from "@/lib/writeHelper";
import type { Expense } from "@/types/pokleh";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  const fetchExpenses = useCallback(async () => {
    try {
      const { data, error } = await expensesRepo.fetchAll();
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

    const tempId = crypto.randomUUID();
    const optimistic: Expense = {
      id: tempId,
      category: input.category,
      amount: input.amount,
      expense_date: input.expense_date,
      notes: input.notes ?? null,
      created_by: userId,
      correction_of: null,
      correction_status: null,
      created_at: new Date().toISOString(),
    };

    return persistWrite<Expense>({
      entity: "expenses",
      action: "INSERT",
      userId,
      data: { ...input, created_by: userId },
      execute: () => expensesRepo.create({ ...input, created_by: userId }),
      optimistic: {
        add: () => setExpenses((prev) => [optimistic, ...prev]),
        remove: () => setExpenses((prev) => prev.filter((e) => e.id !== tempId)),
      },
      onSuccess: (expense) =>
        setExpenses((prev) => prev.map((e) => (e.id === tempId ? expense : e))),
      dexiePut: (expense) =>
        db.expenses.put(expense as unknown as import("@/lib/db").OfflineExpense),
      msg: "Expense recorded",
    });
  };

  useEffect(() => {
    fetchExpenses().finally(() => setLoading(false));
  }, [fetchExpenses]);

  return { expenses, loading, addExpense, refresh: fetchExpenses };
};
