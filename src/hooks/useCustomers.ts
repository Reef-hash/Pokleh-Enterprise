import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { persistWrite } from "@/lib/writeHelper";
import type { Customer } from "@/types/pokleh";

export const useCustomers = (areaId?: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    try {
      let query = supabase.from("customers").select("*, area:areas(*)");
      if (areaId) query = query.eq("area_id", areaId);
      const { data, error } = await query.order("name");
      if (error) throw error;
      const result = (data || []) as unknown as Customer[];
      setCustomers(result);
      await db.customers.bulkPut(
        result.map((c) => ({
          ...c,
          updatedAt: c.updated_at,
          syncedAt: new Date().toISOString(),
        }))
      );
    } catch {
      const cached = await db.customers
        .where("area_id")
        .equals(areaId || "")
        .toArray();
      if (cached.length > 0) {
        setCustomers(cached as unknown as Customer[]);
      }
    }
  }, [areaId]);

  const addCustomer = async (data: {
    name: string;
    phone?: string;
    address?: string;
    area_id: string;
  }) => {
    return persistWrite<Customer>({
      entity: "customers",
      action: "INSERT",
      userId: "system",
      data: data as Record<string, unknown>,
      execute: () =>
        supabase.from("customers").insert(data).select("*, area:areas(*)").single(),
      onSuccess: (customer) => setCustomers((prev) => [...prev, customer]),
      dexiePut: (customer) =>
        db.customers.put({
          ...customer,
          updatedAt: customer.updated_at,
          syncedAt: new Date().toISOString(),
        }),
      msg: "Customer added",
    });
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    return persistWrite<Customer>({
      entity: "customers",
      action: "UPDATE",
      userId: "system",
      id,
      data: updates as Record<string, unknown>,
      execute: () =>
        supabase
          .from("customers")
          .update(updates)
          .eq("id", id)
          .select("*, area:areas(*)")
          .single(),
      onSuccess: (updated) =>
        setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c))),
      dexiePut: (updated) =>
        db.customers.put({
          ...updated,
          updatedAt: updated.updated_at,
          syncedAt: new Date().toISOString(),
        }),
      msg: "Customer updated",
    });
  };

  const toggleActive = async (id: string, active: boolean) => {
    return updateCustomer(id, { active } as Partial<Customer>);
  };

  useEffect(() => {
    fetchCustomers().finally(() => setLoading(false));
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    toggleActive,
    refresh: fetchCustomers,
  };
};
