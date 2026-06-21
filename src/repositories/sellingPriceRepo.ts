import { supabase } from "@/integrations/supabase/client";

export const sellingPriceRepo = {
  fetchAll: () =>
    supabase
      .from("selling_price_list")
      .select("*, customer:customers(id,name)")
      .order("product_type"),

  setPrice: (data: {
    id?: string;
    product_type: string;
    customer_id: string | null;
    price_per_pax: number;
    notes?: string | null;
  }) => {
    if (data.id) {
      return supabase
        .from("selling_price_list")
        .update({ price_per_pax: data.price_per_pax, notes: data.notes ?? null })
        .eq("id", data.id)
        .select("*, customer:customers(id,name)")
        .single();
    }
    return supabase
      .from("selling_price_list")
      .insert({
        product_type: data.product_type,
        customer_id: data.customer_id,
        price_per_pax: data.price_per_pax,
        notes: data.notes ?? null,
      })
      .select("*, customer:customers(id,name)")
      .single();
  },

  delete: (id: string) =>
    supabase.from("selling_price_list").delete().eq("id", id),
};
