import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { offlineDetector } from "@/services/offline";
import { syncEngine } from "@/services/sync";
import { toast } from "sonner";
import type { Customer } from "@/types/pokleh";
import { getUserFriendlyError } from "@/lib/errors";

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
    if (!offlineDetector.isOnline) {
      const tempId = crypto.randomUUID();
      await syncEngine.enqueue({ entity: "customers", entityId: tempId, action: "INSERT", payload: data });
      toast.success("Customer queued for sync");
      return { success: true, offline: true };
    }

    try {
      const { data: result, error } = await supabase
        .from("customers")
        .insert(data)
        .select("*, area:areas(*)")
        .single();
      if (error) {
        toast.error(getUserFriendlyError(error, "customers"));
        return { success: false };
      }
      const customer = result as unknown as Customer;
      setCustomers((prev) => [...prev, customer]);
      await db.customers.put({
        ...customer,
        updatedAt: customer.updated_at,
        syncedAt: new Date().toISOString(),
      });
      toast.success("Customer added");
      return { success: true, data: customer };
    } catch (err: any) {
      toast.error("Connection error. Please try again.");
      return { success: false };
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!offlineDetector.isOnline) {
      await syncEngine.enqueue({ entity: "customers", entityId: id, action: "UPDATE", payload: updates });
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      toast.success("Customer update queued for sync");
      return { success: true, offline: true };
    }

    try {
      const { data: result, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select("*, area:areas(*)")
        .single();
      if (error) {
        toast.error(getUserFriendlyError(error, "customers"));
        return { success: false };
      }
      const updated = result as unknown as Customer;
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      await db.customers.put({
        ...updated,
        updatedAt: updated.updated_at,
        syncedAt: new Date().toISOString(),
      });
      toast.success("Customer updated");
      return { success: true };
    } catch (err: any) {
      toast.error("Connection error. Please try again.");
      return { success: false };
    }
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
