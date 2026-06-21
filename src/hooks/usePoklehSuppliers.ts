import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { offlineDetector } from "@/services/offline";
import { syncEngine } from "@/services/sync";
import { toast } from "sonner";
import type { Supplier } from "@/types/pokleh";
import { getUserFriendlyError } from "@/lib/errors";

export const usePoklehSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      const result = (data || []) as Supplier[];
      setSuppliers(result);
      await db.suppliers.bulkPut(
        result.map((s) => ({ ...s, updatedAt: s.updated_at, syncedAt: new Date().toISOString() }))
      );
    } catch {
      const cached = await db.suppliers.toArray();
      if (cached.length > 0) setSuppliers(cached as unknown as Supplier[]);
    }
  }, []);

  const addSupplier = async (name: string, phone?: string) => {
    if (!offlineDetector.isOnline) {
      const tempId = crypto.randomUUID();
      await syncEngine.enqueue({ entity: "suppliers", entityId: tempId, action: "INSERT", payload: { name, phone: phone || null } });
      toast.success("Supplier queued for sync");
      return { success: true, offline: true };
    }

    const { data, error } = await supabase
      .from("suppliers")
      .insert({ name, phone: phone || null })
      .select()
      .single();
    if (error) {
      toast.error(getUserFriendlyError(error, "suppliers"));
      return { success: false };
    }
    const supplier = data as Supplier;
    setSuppliers((prev) => [...prev, supplier]);
    await db.suppliers.put({ ...supplier, updatedAt: supplier.updated_at, syncedAt: new Date().toISOString() });
    toast.success("Supplier added");
    return { success: true };
  };

  const updateSupplier = async (id: string, name: string, phone?: string) => {
    if (!offlineDetector.isOnline) {
      await syncEngine.enqueue({ entity: "suppliers", entityId: id, action: "UPDATE", payload: { name, phone: phone || null } });
      setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, name, phone: phone || null } : s)));
      toast.success("Supplier update queued for sync");
      return { success: true, offline: true };
    }

    const { error } = await supabase
      .from("suppliers")
      .update({ name, phone: phone || null })
      .eq("id", id);
    if (error) {
      toast.error(getUserFriendlyError(error, "suppliers"));
      return { success: false };
    }
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, name, phone: phone || null } : s)));
    toast.success("Supplier updated");
    return { success: true };
  };

  const deleteSupplier = async (id: string) => {
    if (!offlineDetector.isOnline) {
      await syncEngine.enqueue({ entity: "suppliers", entityId: id, action: "DELETE", payload: {} });
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Supplier delete queued for sync");
      return { success: true, offline: true };
    }

    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      toast.error(getUserFriendlyError(error, "suppliers"));
      return { success: false };
    }
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    toast.success("Supplier deleted");
    return { success: true };
  };

  useEffect(() => {
    fetchSuppliers().finally(() => setLoading(false));
  }, [fetchSuppliers]);

  return { suppliers, loading, addSupplier, updateSupplier, deleteSupplier, refresh: fetchSuppliers };
};
